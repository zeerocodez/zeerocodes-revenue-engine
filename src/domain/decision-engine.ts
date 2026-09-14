import type { LeadScore } from './scoring';
import type { Route } from './routing';
import { routeLead } from './routing';
import { calculateRevenuePriority, type RevenuePriorityResult } from './revenue-priority';

export type DecisionAction =
  | 'reject'
  | 'nurture'
  | 'ai-follow-up'
  | 'sdr-follow-up'
  | 'closer-handoff';

export interface DecisionContext {
  score: LeadScore;
  consent?: boolean;
  hardDisqualified?: boolean;
  requestedHuman?: boolean;
  hasHumanReply?: boolean;
  appointmentBooked?: boolean;
  intent?: 'unknown' | 'information' | 'pricing' | 'qualification' | 'objection' | 'booking' | 'human_request' | 'complaint' | 'stop' | 'purchase';
  urgencyDays?: number;
  estimatedDealValue?: number;
}

export interface DecisionResult {
  action: DecisionAction;
  route: Route;
  reason: string;
  priority: RevenuePriorityResult;
}

/**
 * Central policy layer. Hard rules always win over AI recommendations.
 * Revenue priority influences escalation, but never overrides consent or disqualification.
 */
export function decideLeadAction(context: DecisionContext): DecisionResult {
  const intent = context.intent ?? 'unknown';
  const priority = calculateRevenuePriority({
    score: context.score.score,
    intent,
    urgencyDays: context.urgencyDays,
    estimatedDealValue: context.estimatedDealValue,
    temperature: context.score.band,
  });

  if (context.consent === false || intent === 'stop') {
    return { action: 'reject', route: 'reject', reason: intent === 'stop' ? 'lead requested no further contact' : 'missing or withdrawn consent', priority };
  }

  if (context.hardDisqualified || context.score.hardDisqualified) {
    return { action: 'reject', route: 'reject', reason: 'hard disqualification rule matched', priority };
  }

  if (context.appointmentBooked) {
    return { action: 'closer-handoff', route: 'closer', reason: 'appointment booked', priority };
  }

  if (intent === 'purchase' || intent === 'booking' || priority.band === 'critical') {
    return { action: 'closer-handoff', route: 'closer', reason: 'high revenue intent requires immediate human ownership', priority };
  }

  const route = routeLead(context);

  if (route === 'sdr') {
    return { action: 'sdr-follow-up', route, reason: 'human intent detected', priority };
  }

  if (route === 'ai-follow-up') {
    return { action: 'ai-follow-up', route, reason: 'qualified lead requires automated follow-up', priority };
  }

  if (route === 'nurture') {
    return { action: 'nurture', route, reason: 'lead is not currently sales-ready', priority };
  }

  return { action: 'reject', route, reason: 'routing policy rejected lead', priority };
}
