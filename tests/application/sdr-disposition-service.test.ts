import { describe, expect, it } from 'vitest';
import { createLead, type LeadRecord } from '../../src/domain/lead';
import type { LeadEvent, LeadEventStore } from '../../src/domain/lead-events';
import type { SdrWorkItem } from '../../src/domain/sdr-work-item';
import { LeadLifecycleService, type LeadLifecycleStore } from '../../src/application/lead-lifecycle-service';
import { SdrDispositionService } from '../../src/application/sdr-disposition-service';

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

function item(state: LeadRecord['state']): SdrWorkItem {
  return {
    id: 'sdr_1', organizationId: 'org_1', leadId: 'lead_1', leadName: 'Ada',
    priorityScore: 90, priorityBand: 'high', action: 'call-now', whyNow: 'hot',
    leadState: state, recommendedAction: 'call', deadlineAt: '2026-09-14T10:05:00.000Z',
    slaMinutes: 5, script: { opening: 'Hi', objective: 'qualify', qualificationQuestions: [], objectionResponses: [], closing: 'Next step?' },
    dispositionOptions: ['connected', 'no-answer', 'callback-requested', 'qualified', 'appointment-booked', 'won', 'not-qualified', 'lost', 'nurture', 'wrong-number', 'do-not-contact'],
    createdAt: '2026-09-14T10:00:00.000Z', status: 'claimed',
  };
}

function lead(state: LeadRecord['state']): LeadRecord {
  return { ...createLead({ organizationId: 'org_1', name: 'Ada', consent: true }, '2026-09-14T09:00:00.000Z'), id: 'lead_1', state };
}

describe('SdrDispositionService', () => {
  it('does not fake progress for routine call dispositions', async () => {
    const seeded = lead('qualified');
    const service = new SdrDispositionService(new LeadLifecycleService(new MemoryLeadStore(seeded)));
    const result = await service.apply({ organizationId: 'org_1', item: item('qualified'), disposition: 'connected' });
    expect(result.transitioned).toBe(false);
    expect(result.state).toBe('qualified');
  });

  it('requires appointment evidence before moving qualified to booked', async () => {
    const seeded = lead('qualified');
    const service = new SdrDispositionService(new LeadLifecycleService(new MemoryLeadStore(seeded)));
    await expect(service.apply({ organizationId: 'org_1', item: item('qualified'), disposition: 'appointment-booked' }))
      .rejects.toThrow('appointment-booked requires appointmentId');
  });

  it('moves a qualified lead to booked only with appointment evidence', async () => {
    const seeded = lead('qualified');
    const store = new MemoryLeadStore(seeded);
    const service = new SdrDispositionService(new LeadLifecycleService(store));
    const result = await service.apply({
      organizationId: 'org_1', item: item('qualified'), disposition: 'appointment-booked',
      appointmentId: 'appt_1', appointmentStatus: 'confirmed', now: '2026-09-14T10:00:00.000Z',
    });
    expect(result.state).toBe('booked');
    expect(result.transitioned).toBe(true);
  });

  it('requires booked state before recording a won disposition', async () => {
    const seeded = lead('qualified');
    const service = new SdrDispositionService(new LeadLifecycleService(new MemoryLeadStore(seeded)));
    await expect(service.apply({ organizationId: 'org_1', item: item('qualified'), disposition: 'won' }))
      .rejects.toThrow('won requires lead to be booked');
  });

  it('records won only from a booked lead', async () => {
    const seeded = lead('booked');
    const store = new MemoryLeadStore(seeded);
    const events = new MemoryEventStore();
    const service = new SdrDispositionService(new LeadLifecycleService(store, events));
    const result = await service.apply({ organizationId: 'org_1', item: item('booked'), disposition: 'won', now: '2026-09-14T10:10:00.000Z' });
    expect(result.state).toBe('won');
    expect(events.events.some((event) => event.type === 'lead.won')).toBe(true);
  });

  it('rejects cross-tenant dispositions', async () => {
    const seeded = lead('qualified');
    const service = new SdrDispositionService(new LeadLifecycleService(new MemoryLeadStore(seeded)));
    await expect(service.apply({ organizationId: 'org_2', item: item('qualified'), disposition: 'connected' }))
      .rejects.toThrow('Tenant access denied');
  });
});
