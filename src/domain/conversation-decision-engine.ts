import type { LeadScore } from './scoring';

export type ConversationIntent =
  | 'greeting'
  | 'information_request'
  | 'qualification_answer'
  | 'objection'
  | 'pricing'
  | 'human_request'
  | 'booking_intent'
  | 'stop'
  | 'complaint'
  | 'unknown';

export type ConversationAction =
  | 'acknowledge'
  | 'ask-qualification'
  | 'answer-information'
  | 'handle-objection'
  | 'answer-pricing'
  | 'escalate-sdr'
  | 'handoff-closer'
  | 'opt-out'
  | 'escalate-complaint'
  | 'clarify';

export interface ConversationDecisionContext {
  text: string;
  leadScore: LeadScore;
  consent?: boolean;
  requestedHuman?: boolean;
  appointmentBooked?: boolean;
  qualificationComplete?: boolean;
}

export interface ConversationDecision {
  intent: ConversationIntent;
  action: ConversationAction;
  owner: 'ai' | 'sdr' | 'closer' | 'system';
  reason: string;
  confidence: number;
}

const patterns: Array<{ intent: ConversationIntent; patterns: RegExp[] }> = [
  { intent: 'stop', patterns: [/\bstop\b/i, /unsubscribe/i, /do not contact/i, /remove me/i] },
  { intent: 'human_request', patterns: [/speak to (a )?human/i, /talk to (someone|a person|an agent)/i, /call me/i, /real person/i] },
  { intent: 'booking_intent', patterns: [/book/i, /schedule/i, /appointment/i, /available (today|tomorrow|this week)/i, /when can we meet/i] },
  { intent: 'pricing', patterns: [/how much/i, /price/i, /cost/i, /fee/i, /pricing/i, /what do you charge/i] },
  { intent: 'complaint', patterns: [/angry/i, /terrible/i, /complain/i, /complaint/i, /refund/i, /fraud/i, /scam/i] },
  { intent: 'objection', patterns: [/too expensive/i, /not interested/i, /think about it/i, /not sure/i, /send me details/i, /no budget/i, /later/i] },
  { intent: 'greeting', patterns: [/^hi[!. ]*$/i, /^hello[!. ]*$/i, /^hey[!. ]*$/i, /^good (morning|afternoon|evening)[!. ]*$/i] },
  { intent: 'information_request', patterns: [/what is/i, /how does/i, /tell me more/i, /details/i, /explain/i, /do you offer/i] },
];

export function detectConversationIntent(text: string): ConversationIntent {
  const value = text.trim();
  if (!value) return 'unknown';
  for (const candidate of patterns) {
    if (candidate.patterns.some((pattern) => pattern.test(value))) return candidate.intent;
  }
  return 'qualification_answer';
}

/** Deterministic policy gate for conversational automation. AI/LLM extraction may feed this layer later, but cannot override it. */
export function decideConversation(context: ConversationDecisionContext): ConversationDecision {
  const intent = detectConversationIntent(context.text);

  if (context.consent === false || intent === 'stop') {
    return { intent, action: 'opt-out', owner: 'system', reason: 'contact consent is absent or opt-out intent detected', confidence: 0.99 };
  }
  if (intent === 'complaint') {
    return { intent, action: 'escalate-complaint', owner: 'sdr', reason: 'complaint requires human review', confidence: 0.95 };
  }
  if (context.requestedHuman || intent === 'human_request') {
    return { intent, action: 'escalate-sdr', owner: 'sdr', reason: 'lead requested human assistance', confidence: 0.98 };
  }
  if (intent === 'booking_intent') {
    if (context.appointmentBooked) return { intent, action: 'handoff-closer', owner: 'closer', reason: 'appointment already booked', confidence: 0.99 };
    if (context.leadScore.qualified) return { intent, action: 'handoff-closer', owner: 'closer', reason: 'qualified lead expressed booking intent', confidence: 0.94 };
    return { intent, action: 'ask-qualification', owner: 'ai', reason: 'booking intent detected but qualification is incomplete', confidence: 0.91 };
  }
  if (intent === 'pricing') return { intent, action: 'answer-pricing', owner: 'ai', reason: 'pricing question detected', confidence: 0.93 };
  if (intent === 'objection') return { intent, action: 'handle-objection', owner: 'ai', reason: 'sales objection detected', confidence: 0.9 };
  if (intent === 'information_request') return { intent, action: 'answer-information', owner: 'ai', reason: 'information request detected', confidence: 0.9 };
  if (intent === 'greeting') return { intent, action: context.qualificationComplete ? 'acknowledge' : 'ask-qualification', owner: 'ai', reason: 'greeting received', confidence: 0.99 };
  if (intent === 'qualification_answer') return { intent, action: context.qualificationComplete ? 'acknowledge' : 'ask-qualification', owner: 'ai', reason: 'message treated as qualification input', confidence: 0.7 };
  return { intent, action: 'clarify', owner: 'ai', reason: 'intent could not be determined safely', confidence: 0.4 };
}
