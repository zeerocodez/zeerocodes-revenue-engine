import { describe, expect, it } from 'vitest';
import { createSdrWorkItem, isSlaAtRisk, isSlaBreached } from '../../src/domain/sdr-work-item';

const base = {
  organizationId: 'org_1', leadId: 'lead_1', leadName: 'Ada', leadState: 'qualified' as const,
  priorityScore: 91, priorityBand: 'critical' as const, nextAction: 'closer-call-now' as const,
  reason: 'ready to buy', now: '2026-09-14T10:00:00.000Z', intent: 'purchase' as const,
  slaBreached: false,
};

describe('SDR work item', () => {
  it('creates a critical closer handoff with an immediate SLA', () => {
    const item = createSdrWorkItem(base);
    expect(item.action).toBe('handoff-closer');
    expect(item.priorityBand).toBe('critical');
    expect(item.slaMinutes).toBe(5);
    expect(item.deadlineAt).toBe('2026-09-14T10:05:00.000Z');
  });

  it('creates SLA recovery work when the lead was neglected', () => {
    const item = createSdrWorkItem({ ...base, nextAction: 'sdr-call-now', priorityBand: 'high', priorityScore: 75, slaBreached: true });
    expect(item.action).toBe('recover-sla');
    expect(item.whyNow).toContain('breached');
  });

  it('generates a Nigerian-friendly commercial qualification script', () => {
    const item = createSdrWorkItem({ ...base, nextAction: 'sdr-call-now', priorityBand: 'high', priorityScore: 78 });
    expect(item.script.opening).toContain('following up');
    expect(item.script.qualificationQuestions.length).toBeGreaterThanOrEqual(4);
    expect(item.dispositionOptions).toContain('appointment-booked');
  });

  it('flags an item at risk halfway through its SLA', () => {
    const item = createSdrWorkItem({ ...base, nextAction: 'sdr-call-now', priorityBand: 'high', priorityScore: 78, responseSlaMinutes: 20 });
    expect(isSlaAtRisk(item, '2026-09-14T10:10:00.000Z')).toBe(true);
    expect(isSlaBreached(item, '2026-09-14T10:19:59.000Z')).toBe(false);
    expect(isSlaBreached(item, '2026-09-14T10:20:01.000Z')).toBe(true);
  });
});
