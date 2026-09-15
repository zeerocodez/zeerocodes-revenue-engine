import { describe, expect, it } from 'vitest';
import { createLead, type LeadRecord } from '../../src/domain/lead';
import type { LeadEvent, LeadEventStore } from '../../src/domain/lead-events';
import type { SdrWorkItem } from '../../src/domain/sdr-work-item';
import type { RevenueRecoveryAttribution } from '../../src/domain/revenue-recovery-attribution';
import { LeadLifecycleService, type LeadLifecycleStore } from '../../src/application/lead-lifecycle-service';
import { RevenueRecordingService, type RevenueRecordingStore } from '../../src/application/revenue-recording-service';
import { RevenueRecoveryService } from '../../src/application/revenue-recovery-service';
import { SdrDispositionService } from '../../src/application/sdr-disposition-service';
import { SdrQueueService, type SdrWorkItemStore } from '../../src/application/sdr-queue-service';
import type { RevenueAttributionEvent } from '../../src/domain/revenue-attribution';
import type { RevenueRecoveryAttributionStore } from '../../src/integrations/postgres-recovery-attribution';

class MemoryLeadStore implements LeadLifecycleStore {
  private readonly leads = new Map<string, LeadRecord>();
  constructor(seed: LeadRecord) { this.leads.set(seed.id, structuredClone(seed)); }
  async get(id: string) { return structuredClone(this.leads.get(id) ?? null); }
  async save(lead: LeadRecord) { this.leads.set(lead.id, structuredClone(lead)); }
}

class MemoryEventStore implements LeadEventStore {
  readonly events: LeadEvent[] = [];
  async append(event: LeadEvent) { this.events.push(event); }
  async list(leadId: string) { return this.events.filter((event) => event.leadId === leadId); }
}

class MemoryWorkStore implements SdrWorkItemStore {
  private readonly items = new Map<string, SdrWorkItem>();
  constructor(seed: SdrWorkItem) { this.items.set(seed.id, structuredClone(seed)); }
  async list(organizationId: string) {
    return [...this.items.values()].filter((item) => item.organizationId === organizationId).map((item) => structuredClone(item));
  }
  async save(item: SdrWorkItem) { this.items.set(item.id, structuredClone(item)); }
  async get(id: string) { return structuredClone(this.items.get(id) ?? null); }
}

class MemoryRevenueStore implements RevenueRecordingStore {
  readonly events: RevenueAttributionEvent[] = [];
  private readonly keys = new Map<string, RevenueAttributionEvent>();
  async getById(id: string) { return this.events.find((event) => event.id === id) ?? null; }
  async getByIdempotencyKey(key: string) { return this.keys.get(key) ?? null; }
  async save(event: RevenueAttributionEvent, key: string) { this.events.push(event); this.keys.set(key, event); }
}

class MemoryAttributionStore implements RevenueRecoveryAttributionStore {
  readonly events: RevenueRecoveryAttribution[] = [];
  async save(event: RevenueRecoveryAttribution) {
    if (!this.events.some((existing) => existing.id === event.id)) this.events.push(structuredClone(event));
  }
  async getById(organizationId: string, id: string) {
    const event = this.events.find((candidate) => candidate.organizationId === organizationId && candidate.id === id);
    return event ? structuredClone(event) : null;
  }
  async listByLead(organizationId: string, leadId: string) {
    return this.events.filter((event) => event.organizationId === organizationId && event.leadId === leadId).map((event) => structuredClone(event));
  }
}

function lead(state: LeadRecord['state']): LeadRecord {
  return { ...createLead({ organizationId: 'org_1', name: 'Ada', consent: true }, '2026-09-14T09:00:00.000Z'), id: 'lead_1', state };
}

function item(state: LeadRecord['state']): SdrWorkItem {
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
  const workStore = new MemoryWorkStore(item(seedState));
  const leadStore = new MemoryLeadStore(lead(seedState));
  const events = new MemoryEventStore();
  const revenueStore = new MemoryRevenueStore();
  const attributionStore = new MemoryAttributionStore();
  const queue = new SdrQueueService(workStore);
  const disposition = new SdrDispositionService(new LeadLifecycleService(leadStore, events));
  const recording = new RevenueRecordingService(revenueStore);
  const recovery = new RevenueRecoveryService(queue, disposition, recording, attributionStore);
  return { workStore, leadStore, revenueStore, attributionStore, recovery };
}

describe('RevenueRecoveryService', () => {
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
    const result = await recovery.recover({ organizationId: 'org_1', workItemId: 'sdr_1', ownerId: 'sdr_7', disposition: 'appointment-booked', appointmentId: 'appt_1', appointmentStatus: 'confirmed' });
    expect(result.lifecycleState).toBe('booked');
    expect((await leadStore.get('lead_1'))?.state).toBe('booked');
  });

  it('records recovered revenue and its leakage attribution exactly once', async () => {
    const { recovery, revenueStore, attributionStore, leadStore } = build('booked');
    const result = await recovery.recover({
      organizationId: 'org_1', workItemId: 'sdr_1', ownerId: 'closer_2', disposition: 'won',
      outcomeRevenue: 2500000, currency: 'NGN', leakageOpportunityId: 'leak_1', leakageType: 'qualified-no-booking',
      leakageValue: 3000000, recoverySource: 'closer', now: '2026-09-14T10:10:00.000Z',
    });
    expect(result.lifecycleState).toBe('won');
    expect(result.revenueRecorded).toBe(true);
    expect(result.duplicateRevenue).toBe(false);
    expect(result.revenueAmount).toBe(2500000);
    expect(result.recoveryAttributed).toBe(true);
    expect(revenueStore.events).toHaveLength(1);
    expect(attributionStore.events).toHaveLength(1);
    expect(attributionStore.events[0].leakageOpportunityId).toBe('leak_1');
    expect(attributionStore.events[0].recoveryRate).toBeCloseTo(83.33);
    expect((await leadStore.get('lead_1'))?.state).toBe('won');
  });

  it('replays a duplicate WON request without creating a second revenue event or lifecycle transition', async () => {
    const { recovery, revenueStore, attributionStore } = build('booked');
    const input = {
      organizationId: 'org_1', workItemId: 'sdr_1', ownerId: 'closer_2', disposition: 'won' as const,
      outcomeRevenue: 2500000, currency: 'NGN', leakageOpportunityId: 'leak_1', leakageType: 'qualified-no-booking',
      leakageValue: 3000000, recoverySource: 'closer' as const, now: '2026-09-14T10:10:00.000Z',
    };
    const first = await recovery.recover(input);
    const second = await recovery.recover(input);
    expect(first.duplicateRevenue).toBe(false);
    expect(second.duplicateRevenue).toBe(true);
    expect(second.transitioned).toBe(false);
    expect(second.revenueRecorded).toBe(true);
    expect(second.recoveryAttributed).toBe(true);
    expect(second.revenueAmount).toBe(2500000);
    expect(revenueStore.events).toHaveLength(1);
    expect(attributionStore.events).toHaveLength(1);
  });

  it('rejects won recovery without revenue before changing lifecycle state', async () => {
    const { recovery, leadStore } = build('booked');
    await expect(recovery.recover({ organizationId: 'org_1', workItemId: 'sdr_1', ownerId: 'closer_2', disposition: 'won', currency: 'NGN' })).rejects.toThrow('won recovery requires outcomeRevenue');
    expect((await leadStore.get('lead_1'))?.state).toBe('booked');
  });

  it('rejects won recovery without leakage attribution context', async () => {
    const { recovery, leadStore } = build('booked');
    await expect(recovery.recover({ organizationId: 'org_1', workItemId: 'sdr_1', ownerId: 'closer_2', disposition: 'won', outcomeRevenue: 500000, currency: 'NGN' })).rejects.toThrow('won recovery requires leakageOpportunityId');
    expect((await leadStore.get('lead_1'))?.state).toBe('booked');
  });

  it('rejects cross-tenant recovery', async () => {
    const { recovery } = build('qualified');
    await expect(recovery.recover({ organizationId: 'org_2', workItemId: 'sdr_1', ownerId: 'sdr_7', disposition: 'connected' })).rejects.toThrow('SDR work item not found');
  });
});
