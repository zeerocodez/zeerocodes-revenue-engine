import { describe, expect, it, beforeEach } from 'vitest';
import { RevenueRecoveryService } from '../../src/application/revenue-recovery-service';
import { MemoryRevenueWorkflowRepository } from '../../src/integrations/memory-workflow';
import { MemoryLeadStore } from '../../src/integrations/memory-lead-store';
import { MemoryLeadEventStore } from '../../src/integrations/memory-lead-events';
import { LeadLifecycleService } from '../../src/application/lead-lifecycle-service';
import { createSdrWorkItem } from '../../src/domain/sdr-work-item';
import type { LeadRecord } from '../../src/domain/lead';

describe('RevenueRecoveryService', () => {
  let workflow: MemoryRevenueWorkflowRepository;
  let leadStore: MemoryLeadStore;
  let eventStore: MemoryLeadEventStore;
  let lifecycleService: LeadLifecycleService;
  let recoveryService: RevenueRecoveryService;

  beforeEach(() => {
    workflow = new MemoryRevenueWorkflowRepository();
    leadStore = new MemoryLeadStore();
    eventStore = new MemoryLeadEventStore();
    lifecycleService = new LeadLifecycleService(leadStore, eventStore);
    recoveryService = new RevenueRecoveryService(workflow, leadStore, lifecycleService, eventStore);
  });

  function setupBookedLead(overrides: Partial<LeadRecord> = {}): LeadRecord {
    const lead: LeadRecord = {
      id: 'lead-1',
      organizationId: 'org-alpha',
      name: 'Michael Scott',
      state: 'booked',
      score: 90,
      consent: true,
      createdAt: '2026-09-15T09:00:00.000Z',
      updatedAt: '2026-09-15T11:00:00.000Z',
      commercial: { estimatedDealValue: 250_000, currency: 'NGN' },
      profile: {},
      decision: {
        action: 'closer-handoff',
        route: 'closer',
        reason: 'Ready to book',
        priority: {
          score: 90,
          band: 'critical',
          intentMultiplier: 1.5,
          urgencyMultiplier: 1.2,
          valueMultiplier: 1.1,
          reason: ['Close deal'],
        },
      },
      ...overrides,
    };
    leadStore.save(lead);
    return lead;
  }

  it('successfully executes revenue recovery workflow for booked lead', async () => {
    const lead = setupBookedLead();
    const workItem = createSdrWorkItem({
      organizationId: 'org-alpha',
      leadId: lead.id,
      leadName: lead.name,
      leadState: 'booked',
      priorityScore: 90,
      priorityBand: 'critical',
      nextAction: 'sdr-call-now',
      reason: 'SLA breach during closing follow-up',
      slaBreached: true,
      leakageOpportunityId: 'leak-123',
      leakageType: 'booked-no-sale',
      estimatedRecoverableRevenue: 250_000,
      currency: 'NGN',
    });
    await workflow.saveSdrWorkItem(workItem);

    const result = await recoveryService.executeRecovery({
      organizationId: 'org-alpha',
      workItemId: workItem.id,
      recoveredAmount: 250_000,
      currency: 'NGN',
      ownerUserId: 'agent-1',
      notes: 'Closed annual contract on follow-up call.',
    });

    expect(result.success).toBe(true);
    expect(result.lead.state).toBe('won');
    expect(result.workItem.status).toBe('completed');
    expect(result.workItem.disposition).toBe('won');
    expect(result.outcome.outcome).toBe('won');
    expect(result.outcome.revenueAmount).toBe(250_000);
    expect(result.recoveryAttribution.recoveredAmount).toBe(250_000);
    expect(result.recoveryAttribution.recoveryRate).toBe(100);
    expect(result.recoveryAttribution.evidence).toBe('won-outcome');

    // Verify persisted attributions
    const attributions = await workflow.listRecoveryAttributions('org-alpha', lead.id);
    expect(attributions).toHaveLength(1);
    expect(attributions[0]?.recoveredAmount).toBe(250_000);
  });

  it('ensures recovery execution is strictly idempotent on repeated calls', async () => {
    const lead = setupBookedLead();
    const workItem = createSdrWorkItem({
      organizationId: 'org-alpha',
      leadId: lead.id,
      leadName: lead.name,
      leadState: 'booked',
      priorityScore: 85,
      priorityBand: 'high',
      nextAction: 'sdr-call-now',
      reason: 'Overdue booked follow-up',
      slaBreached: true,
      leakageOpportunityId: 'leak-456',
      leakageType: 'booked-no-sale',
      estimatedRecoverableRevenue: 180_000,
      currency: 'NGN',
    });
    await workflow.saveSdrWorkItem(workItem);

    const firstRun = await recoveryService.executeRecovery({
      organizationId: 'org-alpha',
      workItemId: workItem.id,
      recoveredAmount: 180_000,
      ownerUserId: 'agent-1',
    });
    expect(firstRun.success).toBe(true);
    expect(firstRun.idempotentReplay).toBeFalsy();

    // Second call with same parameters
    const secondRun = await recoveryService.executeRecovery({
      organizationId: 'org-alpha',
      workItemId: workItem.id,
      recoveredAmount: 180_000,
      ownerUserId: 'agent-1',
    });

    expect(secondRun.success).toBe(true);
    expect(secondRun.idempotentReplay).toBe(true);
    expect(secondRun.recoveryAttribution.id).toBe(firstRun.recoveryAttribution.id);

    // Ensure no duplicate revenue attributions exist in store
    const attributions = await workflow.listRecoveryAttributions('org-alpha', lead.id);
    expect(attributions).toHaveLength(1);
  });

  it('rejects recovery when lead is not in booked state', async () => {
    const lead = setupBookedLead({ state: 'qualified' }); // Lead is qualified, but not yet booked
    const workItem = createSdrWorkItem({
      organizationId: 'org-alpha',
      leadId: lead.id,
      leadName: lead.name,
      leadState: 'qualified',
      priorityScore: 80,
      priorityBand: 'high',
      nextAction: 'sdr-call-now',
      reason: 'Qualified lead follow-up',
      slaBreached: false,
    });
    await workflow.saveSdrWorkItem(workItem);

    await expect(
      recoveryService.executeRecovery({
        organizationId: 'org-alpha',
        workItemId: workItem.id,
        recoveredAmount: 100_000,
        ownerUserId: 'agent-1',
      }),
    ).rejects.toThrow("Revenue recovery requires lead to be in 'booked' state");
  });

  it('rejects recovery attempt for another tenant (cross-tenant security)', async () => {
    const lead = setupBookedLead({ organizationId: 'org-alpha' });
    const workItem = createSdrWorkItem({
      organizationId: 'org-alpha',
      leadId: lead.id,
      leadName: lead.name,
      leadState: 'booked',
      priorityScore: 90,
      priorityBand: 'critical',
      nextAction: 'sdr-call-now',
      reason: 'Closing recovery',
      slaBreached: true,
    });
    await workflow.saveSdrWorkItem(workItem);

    // Tenant Beta tries to execute recovery on Tenant Alpha's work item
    await expect(
      recoveryService.executeRecovery({
        organizationId: 'org-beta',
        workItemId: workItem.id,
        recoveredAmount: 200_000,
        ownerUserId: 'agent-hacker',
      }),
    ).rejects.toThrow('SDR work item not found');
  });

  it('rejects recovery if claimed by a different agent', async () => {
    const lead = setupBookedLead();
    const workItem = createSdrWorkItem({
      organizationId: 'org-alpha',
      leadId: lead.id,
      leadName: lead.name,
      leadState: 'booked',
      priorityScore: 90,
      priorityBand: 'critical',
      nextAction: 'sdr-call-now',
      reason: 'Closing recovery',
      slaBreached: true,
    });
    workItem.status = 'claimed';
    workItem.ownerId = 'agent-1';
    await workflow.saveSdrWorkItem(workItem);

    // Agent 2 attempts to finish recovery claimed by Agent 1
    await expect(
      recoveryService.executeRecovery({
        organizationId: 'org-alpha',
        workItemId: workItem.id,
        recoveredAmount: 200_000,
        ownerUserId: 'agent-2',
      }),
    ).rejects.toThrow('SDR work item is claimed by another user (agent-1)');
  });
});
