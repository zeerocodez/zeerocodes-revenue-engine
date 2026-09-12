import { describe, expect, it } from 'vitest';
import { RevenueEngineService } from '../../src/application/revenue-engine-service';
import { MemoryLeadStore } from '../../src/integrations/memory-lead-store';

describe('RevenueEngineService', () => {
  it('intakes and routes a qualified consented lead', async () => {
    const service = new RevenueEngineService(new MemoryLeadStore());
    const result = await service.intake({
      organizationId: 'org_1',
      name: 'Ada',
      phone: '+2348000000000',
      source: 'website',
      consent: true,
      profile: {
        budget: 100000,
        urgencyDays: 7,
        serviceFit: true,
        decisionMaker: true,
        locationFit: true,
        needConfirmed: true,
      },
    });

    expect(result.lead.id).toMatch(/^lead_/);
    expect(result.lead.state).toBe('contacting');
    expect(result.decision.action).toBe('ai-follow-up');
    expect(result.auditEvent.action).toBe('lead_intake_decision');
  });

  it('rejects a lead without consent', async () => {
    const service = new RevenueEngineService(new MemoryLeadStore());
    const result = await service.intake({
      organizationId: 'org_1',
      name: 'No Consent',
      consent: false,
      profile: { serviceFit: true },
    });

    expect(result.decision.action).toBe('reject');
    expect(result.lead.state).toBe('invalid');
  });
});
