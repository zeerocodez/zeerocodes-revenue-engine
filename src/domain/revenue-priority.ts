import type { LeadTemperature } from './opportunity';

export interface RevenuePriorityContext {
  score: number;
  intent: 'unknown' | 'information' | 'pricing' | 'qualification' | 'objection' | 'booking' | 'human_request' | 'complaint' | 'stop' | 'purchase';
  urgencyDays?: number;
  estimatedDealValue?: number;
  temperature?: LeadTemperature;
}

export interface RevenuePriorityResult {
  score: number;
  band: 'low' | 'medium' | 'high' | 'critical';
  intentMultiplier: number;
  urgencyMultiplier: number;
  valueMultiplier: number;
  reason: string[];
}

const INTENT_MULTIPLIER: Record<RevenuePriorityContext['intent'], number> = {
  unknown: 0.8,
  information: 0.75,
  pricing: 1.1,
  qualification: 1.15,
  objection: 1,
  booking: 1.35,
  human_request: 1.25,
  complaint: 0.7,
  stop: 0,
  purchase: 1.5,
};

function urgencyMultiplier(days?: number): number {
  if (days === undefined) return 1;
  if (days <= 1) return 1.5;
  if (days <= 3) return 1.35;
  if (days <= 7) return 1.2;
  if (days <= 14) return 1.05;
  return 0.9;
}

function valueMultiplier(value?: number): number {
  if (!value || value <= 0) return 0.8;
  if (value >= 5000000) return 1.5;
  if (value >= 2000000) return 1.3;
  if (value >= 1000000) return 1.15;
  if (value >= 500000) return 1.05;
  return 0.9;
}

/**
 * Prioritises revenue opportunities without allowing deal value to replace qualification.
 * The score is capped at 100 and remains deterministic for auditability.
 */
export function calculateRevenuePriority(context: RevenuePriorityContext): RevenuePriorityResult {
  const base = Math.max(0, Math.min(100, context.score));
  const intent = INTENT_MULTIPLIER[context.intent];
  const urgency = urgencyMultiplier(context.urgencyDays);
  const value = valueMultiplier(context.estimatedDealValue);
  const raw = base * intent * urgency * value;
  const score = Math.round(Math.max(0, Math.min(100, raw)));

  const reason: string[] = [];
  if (intent >= 1.25) reason.push('strong buying or human intent');
  if (urgency >= 1.35) reason.push('immediate urgency');
  if (value >= 1.3) reason.push('high estimated deal value');
  if (context.temperature === 'hot') reason.push('hot lead temperature');
  if (context.intent === 'stop') reason.push('lead requested no further contact');

  return {
    score,
    band: score >= 85 ? 'critical' : score >= 70 ? 'high' : score >= 45 ? 'medium' : 'low',
    intentMultiplier: intent,
    urgencyMultiplier: urgency,
    valueMultiplier: value,
    reason,
  };
}
