import { describe, expect, it } from 'vitest';
import { buildRevenueActionPlan, isImmediateRevenueAction, requiresHumanRevenueAction } from '../../src/domain/revenue-action-plan';
import type { DecisionResult } from '../../src/domain/decision-engine';

const decision = (action: DecisionResult['action'], route: DecisionResult['route'], priority = 80): DecisionResult => ({
  action,
  route,
  reason: 'test decision',
  priority: {
    score: priority,
    band: priority >= 80 ? 'high' : 'medium',
    reason: ['test'],
    intentMultiplier: 1,
    urgencyMultiplier: 1,
    valueMultiplier: 1,
  },
});

describe('revenue action plan', () => {
  it('turns a critical purchase signal into an immediate closer action', () => {
    const plan = buildRevenueActionPlan({
      state: 'engaged',
      decision: decision('closer-handoff', 'closer', 90),
      score: 90,
      intent: 'purchase',
      urgencyDays: 0,
      estimatedDealValue: 2_000_000,
      hasInboundMessage: true,
      responseSlaMinutes: 5,
    });

    expect(plan.nextAction).toBe('closer-call-now');
    expect(plan.urgency).toBe('immediate');
    expect(requiresHumanRevenueAction(plan)).toBe(true);
    expect(isImmediateRevenueAction(plan)).toBe(true);
  });

  it('turns an overdue SDR opportunity into immediate recovery', () => {
    const now = new Date('2026-09-14T12:00:00.000Z');
    const plan = buildRevenueActionPlan({
      state: 'engaged',
      decision: decision('sdr-follow-up', 'sdr', 70),
      score: 70,
      intent: 'qualification',
      hasInboundMessage: true,
      lastOutboundAt: '2026-09-14T11:50:00.000Z',
      now: now.toISOString(),
      responseSlaMinutes: 5,
    });

    expect(plan.nextAction).toBe('sdr-call-now');
    expect(plan.slaBreached).toBe(true);
    expect(plan.urgency).toBe('immediate');
  });

  it('keeps ordinary AI follow-up out of the human queue', () => {
    const plan = buildRevenueActionPlan({
      state: 'new',
      decision: decision('ai-follow-up', 'ai-follow-up', 40),
      score: 40,
      intent: 'information',
      hasInboundMessage: false,
    });

    expect(plan.nextAction).toBe('send-ai-response');
    expect(requiresHumanRevenueAction(plan)).toBe(false);
  });
});
