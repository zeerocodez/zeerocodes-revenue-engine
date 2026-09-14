import { canTransition, transitionLead, type LeadState } from './lead-state';
import type { QualificationResult } from './qualification';

export type LeadTransitionOutcome = 'none' | 'won' | 'lost' | 'no_sale' | 'no_show' | 'cancelled' | 'unqualified';
export type LeadStateAction = 'none' | 'respond' | 'qualify' | 'follow_up' | 'book' | 'human_escalation' | 'nurture' | 'stop_contact' | 'record_outcome';

export interface LeadTransitionContext {
  from: LeadState;
  to: LeadState;
  consent: boolean;
  qualification?: QualificationResult;
  hasInboundMessage?: boolean;
  hasOutboundMessage?: boolean;
  appointmentStatus?: 'scheduled' | 'confirmed' | 'completed' | 'no_show' | 'cancelled';
  outcome?: LeadTransitionOutcome;
  revenueRecorded?: boolean;
  requestedHuman?: boolean;
  now?: string;
  lastActivityAt?: string;
}

export interface LeadTransitionDecision {
  allowed: boolean;
  from: LeadState;
  to: LeadState;
  reason: string;
  action: LeadStateAction;
  terminal: boolean;
  slaMinutes: number | null;
}

export interface LeadSlaDecision {
  state: LeadState;
  dueAt: string | null;
  breached: boolean;
  slaMinutes: number | null;
  reason: string;
}

export const LEAD_STATE_SLA_MINUTES: Record<LeadState, number | null> = {
  new: 5,
  contacting: 15,
  engaged: 5,
  qualifying: 30,
  qualified: 60,
  booked: null,
  won: null,
  lost: null,
  nurture: 1440,
  invalid: null,
};

const terminalStates = new Set<LeadState>(['won', 'invalid']);

function decision(context: LeadTransitionContext, allowed: boolean, reason: string, action: LeadStateAction): LeadTransitionDecision {
  return {
    allowed,
    from: context.from,
    to: context.to,
    reason,
    action,
    terminal: terminalStates.has(context.to),
    slaMinutes: LEAD_STATE_SLA_MINUTES[context.to],
  };
}

/**
 * Guarded transition policy. `lead-state.ts` defines the graph; this module defines
 * the business evidence required before a graph edge can actually be taken.
 */
export function evaluateLeadTransition(context: LeadTransitionContext): LeadTransitionDecision {
  const { from, to } = context;

  if (from === to) return decision(context, true, 'lead remains in the current state', 'none');
  if (!canTransition(from, to)) return decision(context, false, `transition ${from} -> ${to} is not allowed by the state graph`, 'none');

  if (to === 'invalid') {
    return decision(context, true, 'lead is invalid or must be removed from active sales processing', 'stop_contact');
  }

  if (!context.consent) {
    return decision(context, false, 'active lead processing requires consent', 'stop_contact');
  }

  switch (to) {
    case 'contacting':
      return decision(context, true, from === 'nurture' ? 'lead reactivated into active contact' : 'lead is ready for first contact', 'respond');
    case 'engaged':
      return decision(context, Boolean(context.hasInboundMessage), 'engaged state requires inbound engagement', 'follow_up');
    case 'qualifying':
      return decision(context, Boolean(context.hasInboundMessage), 'qualification starts after an inbound interaction', 'qualify');
    case 'qualified':
      return decision(context, context.qualification?.qualified === true && !context.qualification.hardDisqualified, 'qualified state requires a positive qualification result', 'book');
    case 'booked':
      return decision(
        context,
        context.appointmentStatus === 'scheduled' || context.appointmentStatus === 'confirmed',
        'booked state requires a scheduled or confirmed appointment',
        'book',
      );
    case 'won':
      return decision(context, context.outcome === 'won', 'won state requires an explicit won outcome', 'record_outcome');
    case 'lost':
      return decision(
        context,
        context.outcome === 'lost' || context.outcome === 'no_sale' || context.outcome === 'unqualified',
        'lost state requires an explicit negative sales outcome',
        'record_outcome',
      );
    case 'nurture':
      return decision(
        context,
        context.outcome === 'no_show' ||
          context.outcome === 'cancelled' ||
          context.from === 'new' ||
          context.from === 'contacting' ||
          context.from === 'engaged' ||
          context.from === 'qualifying' ||
          context.from === 'qualified' ||
          context.from === 'booked' ||
          context.from === 'lost',
        'lead can be nurtured and reactivated later',
        'nurture',
      );
    default:
      return decision(context, false, 'no business policy exists for this transition', 'none');
  }
}

export function transitionLeadWithPolicy(context: LeadTransitionContext): LeadTransitionDecision {
  const result = evaluateLeadTransition(context);
  if (!result.allowed) throw new Error(result.reason);
  transitionLead(context.from, context.to);
  return result;
}

export function evaluateLeadStateSla(
  state: LeadState,
  lastActivityAt?: string,
  now = new Date().toISOString(),
): LeadSlaDecision {
  const slaMinutes = LEAD_STATE_SLA_MINUTES[state];
  if (slaMinutes === null || !lastActivityAt) {
    return { state, dueAt: null, breached: false, slaMinutes, reason: slaMinutes === null ? 'state has no active SLA' : 'activity timestamp is unavailable' };
  }

  const activityMs = new Date(lastActivityAt).getTime();
  const nowMs = new Date(now).getTime();
  if (!Number.isFinite(activityMs) || !Number.isFinite(nowMs)) {
    return { state, dueAt: null, breached: false, slaMinutes, reason: 'invalid activity timestamp' };
  }

  const dueAt = new Date(activityMs + slaMinutes * 60_000).toISOString();
  return {
    state,
    dueAt,
    breached: nowMs > new Date(dueAt).getTime(),
    slaMinutes,
    reason: nowMs > new Date(dueAt).getTime() ? `${state} SLA breached` : `${state} SLA is within target`,
  };
}

export function stateHistoryMetadata(context: LeadTransitionContext, result: LeadTransitionDecision): Record<string, unknown> {
  return {
    fromState: context.from,
    toState: context.to,
    reason: result.reason,
    action: result.action,
    terminal: result.terminal,
    slaMinutes: result.slaMinutes,
    outcome: context.outcome,
    appointmentStatus: context.appointmentStatus,
    requestedHuman: context.requestedHuman ?? false,
    transitionedAt: context.now ?? new Date().toISOString(),
  };
}
