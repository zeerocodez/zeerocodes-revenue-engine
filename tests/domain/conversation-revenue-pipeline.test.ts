import { describe, expect, it } from 'vitest';
import { evaluateConversationRevenuePipeline } from '../../src/domain/conversation-revenue-pipeline';
import type { LeadScore } from '../../src/domain/scoring';

const hotScore: LeadScore = {
  score: 90,
  qualified: true,
  hardDisqualified: false,
  reasons: ['strong fit'],
  band: 'hot',
};

const warmScore: LeadScore = {
  score: 65,
  qualified: true,
  hardDisqualified: false,
  reasons: ['reasonable fit'],
  band: 'warm',
};

describe('conversation revenue pipeline', () => {
  it('routes an urgent booking signal to an immediate closer action', () => {
    const result = evaluateConversationRevenuePipeline({
      text: 'I want to book today. How do we start?',
      leadScore: hotScore,
      consent: true,
      appointmentBooked: false,
      qualificationComplete: true,
      state: 'qualified',
      urgencyDays: 0,
      estimatedDealValue: 2_000_000,
      hasInboundMessage: true,
      responseSlaMinutes: 5,
    });

    expect(result.conversation.intent).toBe('booking_intent');
    expect(result.decision.action).toBe('closer-handoff');
    expect(result.plan.nextAction).toBe('closer-call-now');
    expect(result.plan.urgency).toBe('immediate');
  });

  it('routes a human request to the SDR queue', () => {
    const result = evaluateConversationRevenuePipeline({
      text: 'Please let me speak to a human.',
      leadScore: warmScore,
      consent: true,
      qualificationComplete: false,
      state: 'engaged',
      hasInboundMessage: true,
      responseSlaMinutes: 5,
    });

    expect(result.conversation.intent).toBe('human_request');
    expect(result.decision.action).toBe('sdr-follow-up');
    expect(result.plan.nextAction).toBe('sdr-call-now');
  });

  it('stops contact when the lead opts out', () => {
    const result = evaluateConversationRevenuePipeline({
      text: 'Stop messaging me.',
      leadScore: hotScore,
      consent: true,
      qualificationComplete: false,
      state: 'engaged',
      hasInboundMessage: true,
    });

    expect(result.conversation.intent).toBe('stop');
    expect(result.decision.action).toBe('reject');
    expect(result.plan.nextAction).toBe('stop-contact');
  });
});
