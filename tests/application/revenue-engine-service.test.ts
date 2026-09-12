import { describe, expect, it } from 'vitest';
import { RevenueEngineService } from '../../src/application/revenue-engine-service';
import { MemoryLeadEventStore } from '../../src/integrations/memory-lead-events';
import { MemoryLeadStore } from '../../src/integrations/memory-lead-store';
import { MemoryClientConfigurationStore } from '../../src/integrations/memory-client-configuration';
import { ClientConfigurationService } from '../../src/application/client-configuration-service';

describe('RevenueEngineService', () => {
  it('creates, scores and routes a qualified lead', async () => {
    const service = new RevenueEngineService(new MemoryLeadStore());

    const result = await service.intake({
      organizationId: 'org_demo',
      name: 'Ada Customer',
      phone: '+2348000000000',
      source: 'website',
      consent: true,
      profile: {
        serviceFit: true,
        needConfirmed: true,
        decisionMaker: true,
        locationFit: true,
        urgencyDays: 3,
        budget: 250000,
      },
    });

    expect(result.lead.id).toMatch(/^lead_/);
    expect(result.lead.state).toBe('contacting');
    expect(result.lead.qualification?.qualified).toBe(true);
    expect(result.decision.action).toBe('ai-follow-up');
    expect(result.auditEvent.action).toBe('lead_intake_decision');
  });

  it('routes withdrawn consent to invalid', async () => {
    const service = new RevenueEngineService(new MemoryLeadStore());

    const result = await service.intake({
      organizationId: 'org_demo',
      name: 'No Consent',
      consent: false,
      profile: { serviceFit: true },
    });

    expect(result.lead.state).toBe('invalid');
    expect(result.decision.action).toBe('reject');
  });

  it('writes a deterministic event timeline when an event store is supplied', async () => {
    const eventStore = new MemoryLeadEventStore();
    const service = new RevenueEngineService(new MemoryLeadStore(), undefined, eventStore);

    const result = await service.intake({
      organizationId: 'org_demo',
      name: 'Timeline Customer',
      consent: true,
      profile: { serviceFit: true, needConfirmed: true },
    });

    const events = await eventStore.list(result.lead.id);
    expect(events.map((event) => event.type)).toEqual([
      'lead.created',
      'lead.scored',
      'lead.routed',
    ]);
  });

  it('does not illegally rewind a booked lead during redecision', async () => {
    const store = new MemoryLeadStore();
    const service = new RevenueEngineService(store);
    const result = await service.intake({
      organizationId: 'org_demo',
      name: 'Booked Customer',
      consent: true,
      profile: { serviceFit: true, needConfirmed: true, decisionMaker: true, locationFit: true, urgencyDays: 2, budget: 500000 },
    });

    const lead = await store.get(result.lead.id);
    if (!lead) throw new Error('expected lead');
    lead.state = 'booked';
    await store.save(lead);

    const redecided = await service.redecide(lead.id);
    expect(redecided.lead.state).toBe('booked');
  });

  it('applies different scoring rules per tenant on first-touch intake', async () => {
    const store = new MemoryLeadStore();
    const configurationService = new ClientConfigurationService(new MemoryClientConfigurationStore());
    const orgA = await configurationService.get('org_a');
    const orgB = await configurationService.get('org_b');

    orgA.scoring.weights = {
      serviceFit: 80,
      needConfirmed: 20,
      decisionMaker: 0,
      locationFit: 0,
      urgency: 0,
      budget: 0,
    };
    orgA.scoring.threshold = 80;
    orgA.scoring.hotScore = 80;
    orgA.scoring.warmScore = 40;

    orgB.scoring.weights = {
      serviceFit: 10,
      needConfirmed: 10,
      decisionMaker: 20,
      locationFit: 20,
      urgency: 20,
      budget: 20,
    };
    orgB.scoring.threshold = 70;
    orgB.scoring.hotScore = 80;
    orgB.scoring.warmScore = 40;

    await configurationService.save(orgA);
    await configurationService.save(orgB);

    const service = new RevenueEngineService(store, undefined, undefined, configurationService);
    const profile = { serviceFit: true, needConfirmed: true, decisionMaker: false, locationFit: false, urgencyDays: 60, budget: null };

    const leadA = await service.intake({ organizationId: 'org_a', name: 'Tenant A', consent: true, profile });
    const leadB = await service.intake({ organizationId: 'org_b', name: 'Tenant B', consent: true, profile });

    expect(leadA.lead.score).toBe(100);
    expect(leadA.lead.qualification?.qualified).toBe(true);
    expect(leadB.lead.score).toBe(20);
    expect(leadB.lead.qualification?.qualified).toBe(false);
    expect(leadA.lead.metadata?.configurationVersion).toBe(2);
    expect(leadB.lead.metadata?.configurationVersion).toBe(2);
  });
});
