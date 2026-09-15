import { describe, expect, it } from 'vitest';
import { createLead, type LeadRecord } from '../../src/domain/lead';
import type { LeadEvent, LeadEventStore } from '../../src/domain/lead-events';
import type { SdrWorkItem } from '../../src/domain/sdr-work-item';
import { LeadLifecycleService, type LeadLifecycleStore } from '../../src/application/lead-lifecycle-service';
import { RevenueRecordingService, type RevenueRecordingStore } from '../../src/application/revenue-recording-service';
import { RevenueRecoveryService } from '../../src/application/revenue-recovery-service';
import { SdrDispositionService } from '../../src/application/sdr-disposition-service';
import { SdrQueueService, type SdrWorkItemStore } from '../../src/application/sdr-queue-service';
import type { RevenueAttributionEvent } from '../../src/domain/revenue-attribution';

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
  const queue = new SdrQueueService(workStore);
  const disposition = new SdrDispositionService(new LeadLifecycleService(leadStore, events));
  const recording = new RevenueRecordingService(revenueStore);
  const recovery = new RevenueRecoveryService(queue, disposition, recording);
  return { workStore, leadStore, revenueStore, recovery };
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
