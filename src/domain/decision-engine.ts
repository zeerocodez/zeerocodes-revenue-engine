import type { LeadScore } from './scoring';
import type { Route } from './routing';
import { routeLead } from './routing';

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
}

export interface DecisionResult {
  action: DecisionAction;
  route: Route;
  reason: string;
}

/**
 * Central policy layer. Hard rules always win over AI recommendations.
 */
export function decideLeadAction(context: DecisionContext): DecisionResult {
  if (context.consent === false) {
    return { action: 'reject', route: 'reject', reason: 'missing or withdrawn consent' };
  }

  if (context.hardDisqualified) {
    return { action: 'reject', route: 'reject', reason: 'hard disqualification rule matched' };
  }

  const route = routeLead(context);

  if (route === 'closer') {
    return { action: 'closer-handoff', route, reason: 'appointment booked' };
  }

  if (route === 'sdr') {
    return { action: 'sdr-follow-up', route, reason: 'human intent detected' };
  }

  if (route === 'ai-follow-up') {
    return { action: 'ai-follow-up', route, reason: 'qualified lead requires automated follow-up' };
  }

  if (route === 'nurture') {
    return { action: 'nurture', route, reason: 'lead is not currently sales-ready' };
  }

  return { action: 'reject', route, reason: 'routing policy rejected lead' };
}
