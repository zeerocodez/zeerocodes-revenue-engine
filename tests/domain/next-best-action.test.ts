import { describe, expect, it } from 'vitest';
import { scoreLead } from '../../src/domain/scoring';
import { decideLeadAction } from '../../src/domain/decision-engine';
import { calculateRevenuePriority } from '../../src/domain/revenue-priority';
import { determineNextBestAction } from '../../src/domain/next-best-action';

describe('next best action', () => {
  const score = scoreLead({
    serviceFit: true,
    needConfirmed: true,
    decisionMaker: true,
    locationFit: true,
    urgencyDays: 2,
    budget: 1000000,
  });

  it('routes a critical purchase to a closer immediately', () => {
    const decision = decideLeadAction({
      score,
      intent: 'purchase',
      urgencyDays: 2,
      estimatedDealValue: 3000000,
      consent: true,
    });
    const priority = calculateRevenuePriority({
      score: score.score,
      intent: 'purchase',
      urgencyDays: 2,
      estimatedDealValue: 3000000,
      temperature: score.band,
    });

    expect(determineNextBestAction({ state: 'qualified', decision, priority, hasInboundMessage: true }).action).toBe('closer-call-now');
  });

  it('escalates when response SLA is breached', () => {
    const decision = decideLeadAction({ score, intent: 'qualification', consent: true });
    const priority = calculateRevenuePriority({ score: score.score, intent: 'qualification' });

    const result = determineNextBestAction({
      state: 'engaged',
      decision,
      priority,
      hasInboundMessage: true,
      lastOutboundAt: '2026-09-14T09:00:00.000Z',
      now: '2026-09-14T09:10:00.000Z',
      responseSlaMinutes: 5,
    });

    expect(result.slaBreached).toBe(true);
    expect(result.action).toBe('sdr-call-now');
  });
});
