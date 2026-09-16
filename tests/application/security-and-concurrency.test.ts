import { describe, expect, it, beforeEach } from 'vitest';
import { MemoryRevenueWorkflowRepository } from '../../src/integrations/memory-workflow';
import { SdrQueueService } from '../../src/application/sdr-queue-service';
import { RevenueRecoveryService } from '../../src/application/revenue-recovery-service';
import { MemoryLeadStore } from '../../src/integrations/memory-lead-store';
import { MemoryLeadEventStore } from '../../src/integrations/memory-lead-events';
import { LeadLifecycleService } from '../../src/application/lead-lifecycle-service';
import { createSdrWorkItem } from '../../src/domain/sdr-work-item';
import type { LeadRecord } from '../../src/domain/lead';

describe('Security and Concurrency Tests', () => {
  let workflow: MemoryRevenueWorkflowRepository;
  let queueService: SdrQueueService;
  let leadStore: MemoryLeadStore;
  let eventStore: MemoryLeadEventStore;
  let lifecycleService: LeadLifecycleService;
  let recoveryService: RevenueRecoveryService;

  beforeEach(() => {
    workflow = new MemoryRevenueWorkflowRepository();
    queueService = new SdrQueueService(workflow);
    leadStore = new MemoryLeadStore();
    eventStore = new MemoryLeadEventStore();
    lifecycleService = new LeadLifecycleService(leadStore, eventStore);
    recoveryService = new RevenueRecoveryService(workflow, leadStore, lifecycleService, eventStore);
  });

  it('ensures atomic claiming guarantees only 1 SDR can claim an open work item', async () => {
    const item = createSdrWorkItem({
      organizationId: 'tenant-secure',
      leadId: 'lead-concurrency',
      leadName: 'Dwight Schrute',
      leadState: 'qualified',
      priorityScore: 90,
      priorityBand: 'critical',
      nextAction: 'sdr-call-now',
      reason: 'Hot opportunity',
      slaBreached: false,
    });
    await workflow.saveSdrWorkItem(item);

    // Agent 1 claims first
    const agent1Claim = await queueService.claim('tenant-secure', item.id, 'sdr-agent-1');
    expect(agent1Claim.status).toBe('claimed');
    expect(agent1Claim.ownerId).toBe('sdr-agent-1');

    // Agent 2 attempts to claim the same item
    await expect(
      queueService.claim('tenant-secure', item.id, 'sdr-agent-2'),
    ).rejects.toThrow('SDR work item is not open');
  });

  it('strictly isolates tenant data across all workflow operations', async () => {
    // Tenant A lead and work item
    const leadA: LeadRecord = {
      id: 'lead-tenant-a',
      organizationId: 'tenant-a',
      name: 'Client Alpha',
      state: 'booked',
      score: 88,
      consent: true,
      createdAt: '2026-09-15T10:00:00.000Z',
      updatedAt: '2026-09-15T10:00:00.000Z',
      commercial: { estimatedDealValue: 500_000, currency: 'NGN' },
      profile: {},
      decision: {
        action: 'closer-handoff',
        route: 'closer',
        reason: 'Booked',
        priority: { score: 88, band: 'critical', intentMultiplier: 1.5, urgencyMultiplier: 1.0, valueMultiplier: 1.0, reason: [] },
      },
    };
    await leadStore.save(leadA);

    const workItemA = createSdrWorkItem({
      organizationId: 'tenant-a',
      leadId: leadA.id,
      leadName: leadA.name,
      leadState: 'booked',
      priorityScore: 88,
      priorityBand: 'critical',
      nextAction: 'sdr-call-now',
      reason: 'Closing follow-up',
      slaBreached: false,
    });
    await workflow.saveSdrWorkItem(workItemA);

    // Tenant B attempts to access Tenant A work item in queue
    const tenantBQueue = await queueService.queue('tenant-b');
    expect(tenantBQueue.items).toHaveLength(0);

    // Tenant B attempts to claim Tenant A work item
    await expect(
      queueService.claim('tenant-b', workItemA.id, 'user-from-tenant-b'),
    ).rejects.toThrow('SDR work item not found');

    // Tenant B attempts to complete Tenant A work item
    await expect(
      queueService.complete('tenant-b', workItemA.id, 'won'),
    ).rejects.toThrow('SDR work item not found');

    // Tenant B attempts to recover revenue on Tenant A work item
    await expect(
      recoveryService.executeRecovery({
        organizationId: 'tenant-b',
        workItemId: workItemA.id,
        recoveredAmount: 500_000,
        ownerUserId: 'user-from-tenant-b',
      }),
    ).rejects.toThrow('SDR work item not found');
  });

  it('handles concurrent duplicate recovery requests idempotently without double revenue', async () => {
    const lead: LeadRecord = {
      id: 'lead-dupe',
      organizationId: 'tenant-idempotent',
      name: 'Stanley Hudson',
      state: 'booked',
      score: 92,
      consent: true,
      createdAt: '2026-09-15T10:00:00.000Z',
      updatedAt: '2026-09-15T10:00:00.000Z',
      commercial: { estimatedDealValue: 400_000, currency: 'NGN' },
      profile: {},
      decision: {
        action: 'closer-handoff',
        route: 'closer',
        reason: 'Booked',
        priority: { score: 92, band: 'critical', intentMultiplier: 1.5, urgencyMultiplier: 1.0, valueMultiplier: 1.0, reason: [] },
      },
    };
    await leadStore.save(lead);

    const workItem = createSdrWorkItem({
      organizationId: 'tenant-idempotent',
      leadId: lead.id,
      leadName: lead.name,
      leadState: 'booked',
      priorityScore: 92,
      priorityBand: 'critical',
      nextAction: 'sdr-call-now',
      reason: 'Closing deal',
      slaBreached: false,
    });
    await workflow.saveSdrWorkItem(workItem);

    // Execute first recovery
    const res1 = await recoveryService.executeRecovery({
      organizationId: 'tenant-idempotent',
      workItemId: workItem.id,
      recoveredAmount: 400_000,
      ownerUserId: 'sdr-agent',
      idempotencyKey: 'recovery-unique-key-1',
    });
    expect(res1.success).toBe(true);

    // Retry with same idempotency key
    const res2 = await recoveryService.executeRecovery({
      organizationId: 'tenant-idempotent',
      workItemId: workItem.id,
      recoveredAmount: 400_000,
      ownerUserId: 'sdr-agent',
      idempotencyKey: 'recovery-unique-key-1',
    });
    expect(res2.success).toBe(true);
    expect(res2.idempotentReplay).toBe(true);

    // Verify attributions list has exactly 1 entry
    const attributions = await workflow.listRecoveryAttributions('tenant-idempotent', lead.id);
    expect(attributions).toHaveLength(1);
    expect(attributions[0]?.recoveredAmount).toBe(400_000);
  });
});
