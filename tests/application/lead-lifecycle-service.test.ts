import { describe, expect, it } from 'vitest';
import { createLead, type LeadRecord } from '../../src/domain/lead';
import type { LeadEvent, LeadEventStore } from '../../src/domain/lead-events';
import { LeadLifecycleService, type LeadLifecycleStore } from '../../src/application/lead-lifecycle-service';

class MemoryLeadStore implements LeadLifecycleStore {
  private readonly leads = new Map<string, LeadRecord>();

  constructor(seed: LeadRecord) {
    this.leads.set(seed.id, seed);
  }

  async get(id: string): Promise<LeadRecord | null> {
    return this.leads.get(id) ?? null;
  }

  async save(lead: LeadRecord): Promise<void> {
    this.leads.set(lead.id, structuredClone(lead));
  }
}

class MemoryEventStore implements LeadEventStore {
  readonly events: LeadEvent[] = [];

  async append(event: LeadEvent): Promise<void> {
    this.events.push(event);
  }

  async list(leadId: string): Promise<LeadEvent[]> {
    return this.events.filter((event) => event.leadId === leadId);
  }
}

function lead(): LeadRecord {
  return {
    ...createLead({ organizationId: 'org_1', name: 'Ada', consent: true }, '2026-09-14T09:00:00.000Z'),
    id: 'lead_1',
    state: 'contacting',
    engagement: { inboundMessages: 1, outboundMessages: 1, lastInboundAt: '2026-09-14T09:01:00.000Z' },
  };
}

describe('LeadLifecycleService', () => {
  it('enforces evidence before qualification and records state history', async () => {
    const seeded = lead();
    const events = new MemoryEventStore();
    const service = new LeadLifecycleService(new MemoryLeadStore(seeded), events);

    const result = await service.transition({
      leadId: seeded.id,
      organizationId: seeded.organizationId,
      from: seeded.state,
      to: 'engaged',
      consent: true,
      hasInboundMessage: true,
      now: '2026-09-14T09:02:00.000Z',
    });

    expect(result.lead.state).toBe('engaged');
    expect(result.lead.previousState).toBe('contacting');
    expect(result.lead.metadata?.lastStateTransition).toMatchObject({ fromState: 'contacting', toState: 'engaged' });
    expect(events.events.map((event) => event.type)).toContain('lead.state_changed');
  });

  it('blocks BOOKED without a scheduled appointment', async () => {
    const seeded = { ...lead(), state: 'qualified' as const };
    const service = new LeadLifecycleService(new MemoryLeadStore(seeded));

    await expect(service.transition({
      leadId: seeded.id,
      organizationId: seeded.organizationId,
      from: 'qualified',
      to: 'booked',
      consent: true,
    })).rejects.toThrow('booked state requires a scheduled or confirmed appointment');
  });

  it('blocks WON without an explicit won outcome', async () => {
    const seeded = { ...lead(), state: 'booked' as const };
    const service = new LeadLifecycleService(new MemoryLeadStore(seeded));

    await expect(service.transition({
      leadId: seeded.id,
      organizationId: seeded.organizationId,
      from: 'booked',
      to: 'won',
      consent: true,
      appointmentStatus: 'completed',
    })).rejects.toThrow('won state requires an explicit won outcome');
  });

  it('records WON and LOST lifecycle events from explicit outcomes', async () => {
    const wonLead = { ...lead(), state: 'booked' as const };
    const wonEvents = new MemoryEventStore();
    const wonService = new LeadLifecycleService(new MemoryLeadStore(wonLead), wonEvents);

    await wonService.transition({
      leadId: wonLead.id,
      organizationId: wonLead.organizationId,
      from: 'booked',
      to: 'won',
      consent: true,
      appointmentStatus: 'completed',
      outcome: 'won',
      now: '2026-09-14T10:00:00.000Z',
    });

    expect(wonEvents.events.some((event) => event.type === 'lead.won')).toBe(true);

    const lostLead = { ...lead(), state: 'qualified' as const };
    const lostEvents = new MemoryEventStore();
    const lostService = new LeadLifecycleService(new MemoryLeadStore(lostLead), lostEvents);

    await lostService.transition({
      leadId: lostLead.id,
      organizationId: lostLead.organizationId,
      from: 'qualified',
      to: 'lost',
      consent: true,
      outcome: 'no_sale',
    });

    expect(lostEvents.events.some((event) => event.type === 'lead.lost')).toBe(true);
  });

  it('evaluates the SLA from the lead activity timestamp', async () => {
    const seeded = lead();
    const service = new LeadLifecycleService(new MemoryLeadStore(seeded));

    const result = await service.evaluateSla(seeded.id, seeded.organizationId, '2026-09-14T09:10:00.000Z');

    expect(result.slaMinutes).toBe(15);
    expect(result.breached).toBe(false);
    expect(result.dueAt).toBe('2026-09-14T09:16:00.000Z');
  });
});
