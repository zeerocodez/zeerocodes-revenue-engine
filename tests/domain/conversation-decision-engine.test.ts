import { describe, expect, it } from 'vitest';
import { decideConversation, detectConversationIntent } from '../../src/domain/conversation-decision-engine';
import type { LeadScore } from '../../src/domain/scoring';

const qualified: LeadScore = {
  score: 90,
  band: 'hot',
  qualified: true,
  reasons: ['service fit', 'need confirmed'],
  hardDisqualified: false,
};

const warm: LeadScore = {
  score: 60,
  band: 'warm',
  qualified: false,
  reasons: ['service fit'],
  hardDisqualified: false,
};

describe('conversation decision engine', () => {
  it('detects booking intent', () => {
    expect(detectConversationIntent('Can we book an appointment tomorrow?')).toBe('booking_intent');
  });

  it('routes qualified booking intent to closer', () => {
    expect(decideConversation({ text: 'I want to book', leadScore: qualified }).action).toBe('handoff-closer');
  });

  it('does not hand off an unqualified booking request', () => {
    const decision = decideConversation({ text: 'Can I schedule a call?', leadScore: warm });
    expect(decision.action).toBe('ask-qualification');
    expect(decision.owner).toBe('ai');
  });

  it('always honors opt-out', () => {
    const decision = decideConversation({ text: 'Stop contacting me', leadScore: qualified });
    expect(decision.action).toBe('opt-out');
    expect(decision.owner).toBe('system');
  });

  it('escalates a human request', () => {
    const decision = decideConversation({ text: 'Please let me speak to a human', leadScore: qualified });
    expect(decision.action).toBe('escalate-sdr');
    expect(decision.owner).toBe('sdr');
  });
});
