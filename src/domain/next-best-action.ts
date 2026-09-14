import type { LeadState } from './lead-state';
import type { DecisionResult } from './decision-engine';
import type { RevenuePriorityResult } from './revenue-priority';

export type NextBestAction =
  | 'reject'
  | 'send-ai-response'
  | 'send-follow-up'
  | 'sdr-call-now'
  | 'closer-call-now'
  | 'book-appointment'
  | 'nurture'
  | 'stop-contact';

export interface NextBestActionContext {
  state: LeadState;
  decision: DecisionResult;
  priority: RevenuePriorityResult;
  hasInboundMessage: boolean;
  lastOutboundAt?: string;
  now?: string;
  responseSlaMinutes?: number;
}

export interface NextBestActionResult {
  action: NextBestAction;
  urgency: 'immediate' | 'high' | 'normal' | 'low';
  reason: string;
  slaBreached: boolean;
}

function minutesSince(timestamp: string | undefined, now: string): number | null {
  if (!timestamp) return null;
  const value = (Date.parse(now) - Date.parse(timestamp)) / 60000;
  return Number.isFinite(value) && value >= 0 ? value : null;
}

/** Deterministic operational layer: converts the decision engine output into one executable next action. */
export function determineNextBestAction(context: NextBestActionContext): NextBestActionResult {
  const now = context.now ?? new Date().toISOString();
  const slaMinutes = Math.max(1, context.responseSlaMinutes ?? 5);
  const elapsed = minutesSince(context.lastOutboundAt, now);
  const slaBreached = context.hasInboundMessage && elapsed !== null && elapsed > slaMinutes;

  if (context.decision.action === 'reject') {
    return {
      action: context.decision.reason.includes('no further contact') ? 'stop-contact' : 'reject',
      urgency: 'low',
      reason: context.decision.reason,
      slaBreached,
    };
  }

  if (context.decision.action === 'closer-handoff') {
    return { action: 'closer-call-now', urgency: 'immediate', reason: context.decision.reason, slaBreached };
  }

  if (context.priority.band === 'critical' || slaBreached) {
    return { action: 'sdr-call-now', urgency: 'immediate', reason: slaBreached ? 'response SLA breached' : 'critical revenue priority', slaBreached };
  }

  if (context.decision.action === 'sdr-follow-up') {
    return { action: 'sdr-call-now', urgency: 'high', reason: context.decision.reason, slaBreached };
  }

  if (context.decision.action === 'ai-follow-up') {
    if (context.state === 'new' || context.state === 'engaged') {
      return { action: 'send-ai-response', urgency: 'immediate', reason: 'qualified lead requires immediate automated response', slaBreached };
    }
    return { action: 'send-follow-up', urgency: 'normal', reason: context.decision.reason, slaBreached };
  }

  return { action: 'nurture', urgency: 'low', reason: context.decision.reason, slaBreached };
}
