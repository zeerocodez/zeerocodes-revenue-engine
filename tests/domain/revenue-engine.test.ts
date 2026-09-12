import { describe, expect, it } from 'vitest';
import { qualifyLead } from '../../src/domain/qualification';
import { scoreLead } from '../../src/domain/scoring';
import { canTransition } from '../../src/domain/lead-state';
import { routeLead } from '../../src/domain/routing';
import { calculatePricing } from '../../src/domain/pricing';

describe('qualification engine', () => {
  it('qualifies a strong lead at the configured threshold', () => {
    const result = qualifyLead({ serviceFit: true, needConfirmed: true, decisionMaker: true, locationFit: true, urgencyDays: 7, budget: 100000 });
    expect(result.score).toBe(100);
    expect(result.qualified).toBe(true);
    expect(result.hardDisqualified).toBe(false);
  });

  it('does not qualify a weak lead', () => {
    const result = qualifyLead({ serviceFit: true, needConfirmed: false, decisionMaker: false, locationFit: false, urgencyDays: 60, budget: null });
    expect(result.qualified).toBe(false);
  });

  it('supports client-specific hard disqualification rules', () => {
    const result = qualifyLead(
      { serviceFit: true, needConfirmed: true, decisionMaker: false, locationFit: true, urgencyDays: 2, budget: 100000 },
      {
        threshold: 70,
        weights: { serviceFit: 25, needConfirmed: 20, decisionMaker: 20, locationFit: 15, urgency: 10, budget: 10 },
        maxUrgencyDays: 14,
        requireDecisionMaker: true,
        requireBudget: false,
      },
    );
    expect(result.hardDisqualified).toBe(true);
    expect(result.qualified).toBe(false);
    expect(routeLead({ score: { ...scoreLead({ serviceFit: true }), hardDisqualified: true } })).toBe('reject');
  });
});

describe('lead scoring and routing', () => {
  it('assigns hot band to high scores', () => {
    const result = scoreLead({ serviceFit: true, needConfirmed: true, decisionMaker: true, locationFit: true, urgencyDays: 2, budget: 1 });
    expect(result.band).toBe('hot');
  });

  it('sends booked leads to the closer', () => {
    const score = scoreLead({ serviceFit: true, needConfirmed: true, decisionMaker: true, locationFit: true, urgencyDays: 2, budget: 1 });
    expect(routeLead({ score, appointmentBooked: true })).toBe('closer');
  });
});

describe('lead state machine', () => {
  it('allows normal progression', () => {
    expect(canTransition('new', 'contacting')).toBe(true);
    expect(canTransition('qualified', 'booked')).toBe(true);
  });

  it('blocks invalid jumps', () => {
    expect(canTransition('new', 'won')).toBe(false);
    expect(canTransition('won', 'contacting')).toBe(false);
  });
});

describe('pricing calculator', () => {
  it('calculates qualified volume and value', () => {
    const result = calculatePricing({ monthlyLeadVolume: 100, qualificationRate: 0.25, qualifiedLeadValue: 100000, responseSlaMinutes: 5, serviceTier: 'growth' });
    expect(result.estimatedQualifiedLeads).toBe(25);
    expect(result.estimatedMonthlyValue).toBe(2500000);
    expect(result.recommendedMonthlyFee).toBe(247500);
    expect(result.recommendedQualifiedLeadFee).toBe(9900);
  });
});
