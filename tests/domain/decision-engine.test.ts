import { describe, expect, it } from 'vitest';
import { decideLeadAction } from '../../src/domain/decision-engine';
import { evaluateClientPolicy } from '../../src/domain/client-policy';
import { scoreLead } from '../../src/domain/scoring';

describe('client policy', () => {
  it('hard-disqualifies a lead that fails a required fit', () => {
    const result = evaluateClientPolicy(
      { serviceFit: false, needConfirmed: true, decisionMaker: true },
      { qualificationThreshold: 70, requireServiceFit: true },
    );

    expect(result.hardDisqualified).toBe(true);
    expect(result.disqualificationReason).toBe('service fit failed');
  });
});

describe('decision engine', () => {
  const hot = scoreLead({
    serviceFit: true,
    needConfirmed: true,
    decisionMaker: true,
    locationFit: true,
    urgencyDays: 3,
    budget: 250000,
  });

  it('always rejects withdrawn consent', () => {
    expect(decideLeadAction({ score: hot, consent: false }).action).toBe('reject');
  });

  it('hands booked opportunities to a closer', () => {
    expect(decideLeadAction({ score: hot, appointmentBooked: true }).action).toBe('closer-handoff');
  });

  it('escalates human intent to an SDR', () => {
    expect(decideLeadAction({ score: hot, requestedHuman: true }).action).toBe('sdr-follow-up');
  });
});
