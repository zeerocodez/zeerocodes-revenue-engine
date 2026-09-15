import { describe, expect, it } from 'vitest';
import { auditLifecycleEvent, summarizeLifecycleAudit } from '../../src/domain/lifecycle-audit';
import type { LeadEvent } from '../../src/domain/lead-events';

const base: LeadEvent = {
  id: 'evt-1', leadId: 'lead-1', organizationId: 'org-1', type: 'lead.state_changed',
  actor: 'system', timestamp: '2026-09-15T08:00:00.000Z', fromState: 'qualified', toState: 'booked',
};

describe('lifecycle audit', () => {
  it('flags booked without appointment evidence', () => {
    const result = auditLifecycleEvent(base);
    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain('booked-without-appointment');
  });

  it('flags won without explicit win evidence', () => {
    const result = auditLifecycleEvent({
      ...base,
      id: 'evt-2',
      fromState: 'booked',
      toState: 'won',
      metadata: {},
    });
    expect(result.issues.map((issue) => issue.code)).toContain('won-without-win-evidence');
  });

  it('accepts valid booked and won events with evidence', () => {
    const booked = auditLifecycleEvent({
      ...base,
      metadata: { appointmentId: 'appt-1' },
    });
    const won = auditLifecycleEvent({
      ...base,
      id: 'evt-3',
      fromState: 'booked',
      toState: 'won',
      metadata: { outcome: 'won' },
    });
    expect(booked.valid).toBe(true);
    expect(won.valid).toBe(true);
  });

  it('summarizes invalid events without double-counting them', () => {
    const summary = summarizeLifecycleAudit([base, { ...base, id: 'evt-4', toState: 'engaged' }]);
    expect(summary.eventsAudited).toBe(2);
    expect(summary.invalidEvents).toBe(2);
    expect(summary.validEvents).toBe(0);
  });
});
