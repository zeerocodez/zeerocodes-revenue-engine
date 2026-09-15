import { describe, expect, it } from 'vitest';
import { QualificationOrchestrator } from '../../src/application/qualification-orchestrator';
import type { LeadRecord } from '../../src/domain/lead';
import type { ClientQualificationPolicy } from '../../src/domain/client-policy';

const policy: ClientQualificationPolicy = {
  qualificationThreshold: 70,
  requireDecisionMaker: false,
  requireServiceFit: true,
  requireLocationFit: false,
};

function lead(): LeadRecord {
  return {
    id: 'lead_1', organizationId: 'org_1', name: 'Ada', state: 'qualified',
    profile: { serviceFit: true, needConfirmed: true, decisionMaker: true, locationFit: true, urgencyDays: 0, budget: 200000 },
    consent: true, createdAt: '2026-09-15T08:00:00.000Z', updatedAt: '2026-09-15T08:00:00.000Z',
    qualification: { score: 100, qualified: true, reasons: ['qualified'], hardDisqualified: false },
  };
}

describe('qualification orchestrator lifecycle integrity', () => {
  it('does not convert a closer handoff into booked without an appointment', async () => {
    const stored = lead();
    const service = new QualificationOrchestrator({
      get: async () => stored,
      save: async (next) => { Object.assign(stored, next); },
      list: async () => [stored],
    });

    const result = await service.process({
      leadId: 'lead_1', organizationId: 'org_1',
      text: 'Yes, I am the owner. I want to book an appointment now. My budget is ₦200,000.',
      policy,
    });

    expect(result.conversationDecision.action).toBe('handoff-closer');
    expect(result.lead.state).toBe('qualified');
  });
});
