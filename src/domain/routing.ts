import type { LeadScore } from './scoring';

export type Route = 'ai-follow-up' | 'sdr' | 'closer' | 'nurture' | 'reject';

export interface RoutingContext {
  score: LeadScore;
  hasHumanReply?: boolean;
  requestedHuman?: boolean;
  appointmentBooked?: boolean;
}

export function routeLead(context: RoutingContext): Route {
  const { score, hasHumanReply, requestedHuman, appointmentBooked } = context;

  if (score.hardDisqualified) return 'reject';
  if (appointmentBooked) return 'closer';
  if (requestedHuman || hasHumanReply) return 'sdr';
  if (score.qualified) return 'ai-follow-up';
  return score.band === 'cold' ? 'nurture' : 'sdr';
}
