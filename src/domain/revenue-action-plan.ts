import type { LeadState } from './lead-state';
import type { DecisionResult } from './decision-engine';
import { calculateRevenuePriority, type RevenuePriorityContext, type RevenuePriorityResult } from './revenue-priority';
import { determineNextBestAction, type NextBestAction, type NextBestActionContext, type NextBestActionResult } from './next-best-action';

export interface RevenueActionPlanContext extends RevenuePriorityContext, Omit<NextBestActionContext, 'decision' | 'priority'> {
  decision: DecisionResult;
}

export interface RevenueActionPlan {
  priority: RevenuePriorityResult;
  nextAction: NextBestAction;
  urgency: NextBestActionResult['urgency'];
  slaBreached: boolean;
  reason: string;
}

/**
 * Single application-facing decision artifact: revenue priority + executable next action.
 * This keeps downstream channels (WhatsApp, email, voice, SDR queues) from inventing
 * their own routing rules.
 */
export function buildRevenueActionPlan(context: RevenueActionPlanContext): RevenueActionPlan {
  const priority = calculateRevenuePriority(context);
  const next = determineNextBestAction({
    ...context,
    decision: context.decision,
    priority,
  });

  return {
    priority,
    nextAction: next.action,
    urgency: next.urgency,
    slaBreached: next.slaBreached,
    reason: next.reason,
  };
}

export function isImmediateRevenueAction(plan: RevenueActionPlan): boolean {
  return plan.urgency === 'immediate';
}

export function requiresHumanRevenueAction(plan: RevenueActionPlan): boolean {
  return plan.nextAction === 'sdr-call-now' || plan.nextAction === 'closer-call-now';
}
