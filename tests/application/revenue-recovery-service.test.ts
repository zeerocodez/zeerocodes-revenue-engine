import { describe, expect, it, beforeEach } from 'vitest';
import { RevenueRecoveryService } from '../../src/application/revenue-recovery-service';
import { MemoryRevenueWorkflowRepository } from '../../src/integrations/memory-workflow';
import { MemoryLeadStore } from '../../src/integrations/memory-lead-store';
import { MemoryLeadEventStore } from '../../src/integrations/memory-lead-events';
import { LeadLifecycleService, type LeadLifecycleStore } from '../../src/application/lead-lifecycle-service';
import { RevenueRecordingService, type RevenueRecordingStore } from '../../src/application/revenue-recording-service';
import { SdrDispositionService } from '../../src/application/sdr-disposition-service';
import { SdrQueueService, type SdrWorkItemStore } from '../../src/application/sdr-queue-service';
import { createLead, type LeadRecord } from '../../src/domain/lead';
import type { LeadEvent, LeadEventStore } from '../../src/domain/lead-events';
import { createSdrWorkItem, type SdrWorkItem } from '../../src/domain/sdr-work-item';
import type { RevenueAttributionEvent } from '../../src/domain/revenue-attribution';

describe('RevenueRecoveryService - executeRecovery (comprehensive workflow)', () => {
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

describe('RevenueRecoveryService - recover (queue disposition loop)', () => {
  class MockLeadStore implements LeadLifecycleStore {
    private readonly leads = new Map<string, LeadRecord>();
    constructor(seed: LeadRecord) { this.leads.set(seed.id, structuredClone(seed)); }
    async get(id: string) { return structuredClone(this.leads.get(id) ?? null); }
    async save(lead: LeadRecord) { this.leads.set(lead.id, structuredClone(lead)); }
  }

  class MockEventStore implements LeadEventStore {
    readonly events: LeadEvent[] = [];
    async append(event: LeadEvent) { this.events.push(event); }
    async list(leadId: string) { return this.events.filter((event) => event.leadId === leadId); }
  }

  class MockWorkStore implements SdrWorkItemStore {
    private readonly items = new Map<string, SdrWorkItem>();
    constructor(seed: SdrWorkItem) { this.items.set(seed.id, structuredClone(seed)); }
    async list(organizationId: string) {
      return [...this.items.values()].filter((item) => item.organizationId === organizationId).map((item) => structuredClone(item));
    }
    async save(item: SdrWorkItem) { this.items.set(item.id, structuredClone(item)); }
    async get(id: string) { return structuredClone(this.items.get(id) ?? null); }
  }

  class MockRevenueStore implements RevenueRecordingStore {
    readonly events: RevenueAttributionEvent[] = [];
    private readonly keys = new Map<string, RevenueAttributionEvent>();
    async getById(id: string) { return this.events.find((event) => event.id === id) ?? null; }
    async getByIdempotencyKey(key: string) { return this.keys.get(key) ?? null; }
    async save(event: RevenueAttributionEvent, key: string) { this.events.push(event); this.keys.set(key, event); }
  }

  function mockLead(state: LeadRecord['state']): LeadRecord {
    return { ...createLead({ organizationId: 'org_1', name: 'Ada', consent: true }, '2026-09-14T09:00:00.000Z'), id: 'lead_1', state };
  }

  function mockItem(state: LeadRecord['state']): SdrWorkItem {
    return {
      id: 'sdr_1', organizationId: 'org_1', leadId: 'lead_1', leadName: 'Ada',
      priorityScore: 95, priorityBand: 'critical', action: 'call-now', whyNow: 'purchase intent',
      leadState: state, recommendedAction: 'call', deadlineAt: '2026-09-14T10:05:00.000Z',
      slaMinutes: 5, slaBreached: true,
      script: { opening: 'Hi', objective: 'close', qualificationQuestions: [], objectionResponses: [], closing: 'Next step?' },
      dispositionOptions: ['connected', 'no-answer', 'callback-requested', 'qualified', 'appointment-booked', 'won', 'not-qualified', 'lost', 'nurture', 'wrong-number', 'do-not-contact'],
      createdAt: '2026-09-14T10:00:00.000Z', status: 'open',
    };
  }

  function build(seedState: LeadRecord['state']) {
    const workStore = new MockWorkStore(mockItem(seedState));
    const leadStore = new MockLeadStore(mockLead(seedState));
    const events = new MockEventStore();
    const revenueStore = new MockRevenueStore();
    const queue = new SdrQueueService(workStore);
    const disposition = new SdrDispositionService(new LeadLifecycleService(leadStore, events));
    const recording = new RevenueRecordingService(revenueStore);
    const recovery = new RevenueRecoveryService(queue, disposition, recording);
    return { workStore, leadStore, revenueStore, recovery };
  }

  it('claims an open exception and completes a routine disposition', async () => {
    const { recovery, workStore } = build('qualified');
    const result = await recovery.recover({ organizationId: 'org_1', workItemId: 'sdr_1', ownerId: 'sdr_7', disposition: 'connected' });
    expect(result.lifecycleState).toBe('qualified');
    expect(result.transitioned).toBe(false);
    expect(result.workItem.status).toBe('completed');
    expect(result.workItem.ownerId).toBe('sdr_7');
    expect((await workStore.list('org_1'))[0].status).toBe('completed');
  });

  it('moves qualified to booked only when appointment evidence exists', async () => {
    const { recovery, leadStore } = build('qualified');
    const result = await recovery.recover({
      organizationId: 'org_1', workItemId: 'sdr_1', ownerId: 'sdr_7', disposition: 'appointment-booked',
      appointmentId: 'appt_1', appointmentStatus: 'confirmed',
    });
    expect(result.lifecycleState).toBe('booked');
    expect((await leadStore.get('lead_1'))?.state).toBe('booked');
  });

  it('records recovered revenue exactly once when a booked lead is won', async () => {
    const { recovery, revenueStore, leadStore } = build('booked');
    const result = await recovery.recover({
      organizationId: 'org_1', workItemId: 'sdr_1', ownerId: 'closer_2', disposition: 'won',
      outcomeRevenue: 2500000, currency: 'NGN', now: '2026-09-14T10:10:00.000Z',
    });
    expect(result.lifecycleState).toBe('won');
    expect(result.revenueRecorded).toBe(true);
    expect(result.duplicateRevenue).toBe(false);
    expect(result.revenueAmount).toBe(2500000);
    expect(revenueStore.events).toHaveLength(1);
    expect(revenueStore.events[0].attributionType).toBe('recovered');
    expect((await leadStore.get('lead_1'))?.state).toBe('won');
  });

  it('rejects won recovery without revenue before changing lifecycle state', async () => {
    const { recovery, leadStore } = build('booked');
    await expect(recovery.recover({
      organizationId: 'org_1', workItemId: 'sdr_1', ownerId: 'closer_2', disposition: 'won', currency: 'NGN',
    })).rejects.toThrow('won recovery requires outcomeRevenue');
    expect((await leadStore.get('lead_1'))?.state).toBe('booked');
  });

  it('rejects cross-tenant recovery', async () => {
    const { recovery } = build('qualified');
    await expect(recovery.recover({ organizationId: 'org_2', workItemId: 'sdr_1', ownerId: 'sdr_7', disposition: 'connected' }))
      .rejects.toThrow('SDR work item not found');
  });
});
