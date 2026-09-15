import { canTransition } from './lead-state';
import type { LeadEvent } from './lead-events';

export interface LifecycleAuditIssue {
  eventId: string;
  leadId: string;
  code: 'invalid-transition' | 'booked-without-appointment' | 'won-without-win-evidence';
  message: string;
}

export interface LifecycleAuditResult {
  valid: boolean;
  issues: LifecycleAuditIssue[];
}

export interface LifecycleAuditSummary {
  eventsAudited: number;
  validEvents: number;
  invalidEvents: number;
  issues: LifecycleAuditIssue[];
}

/** Audits persisted lifecycle events for state-machine and evidence violations. */
export function auditLifecycleEvent(event: LeadEvent): LifecycleAuditResult {
  if (event.type !== 'lead.state_changed' || !event.fromState || !event.toState) {
    return { valid: true, issues: [] };
  }

  const issues: LifecycleAuditIssue[] = [];
  const metadata = event.metadata ?? {};

  if (!canTransition(event.fromState, event.toState)) {
    issues.push({
      eventId: event.id,
      leadId: event.leadId,
      code: 'invalid-transition',
      message: `Invalid lifecycle transition: ${event.fromState} -> ${event.toState}`,
    });
  }

  if (event.toState === 'booked' && metadata.appointmentStatus !== 'scheduled' && metadata.appointmentStatus !== 'confirmed') {
    issues.push({
      eventId: event.id,
      leadId: event.leadId,
      code: 'booked-without-appointment',
      message: 'Booked state requires a scheduled or confirmed appointment.',
    });
  }

  if (event.toState === 'won' && metadata.outcome !== 'won') {
    issues.push({
      eventId: event.id,
      leadId: event.leadId,
      code: 'won-without-win-evidence',
      message: 'Won state requires explicit won outcome evidence.',
    });
  }

  return { valid: issues.length === 0, issues };
}

export function summarizeLifecycleAudit(events: LeadEvent[]): LifecycleAuditSummary {
  const stateEvents = events.filter((event) => event.type === 'lead.state_changed');
  const issues = stateEvents.flatMap((event) => auditLifecycleEvent(event).issues);
  const invalidEventIds = new Set(issues.map((issue) => issue.eventId));
  return {
    eventsAudited: stateEvents.length,
    validEvents: stateEvents.length - invalidEventIds.size,
    invalidEvents: invalidEventIds.size,
    issues,
  };
}
