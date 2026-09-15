import { describe, expect, it } from 'vitest';
import { buildRevenueControlPlane } from '../../src/domain/revenue-control-plane';
import type { RevenueIntelligenceResult } from '../../src/application/revenue-intelligence-service';
import type { SdrPerformanceResult } from '../../src/application/sdr-performance-service';
import type { SdrWorkItem } from '../../src/domain/sdr-work-item';

const intelligence: RevenueIntelligenceResult = {
  funnel: { leads: 20, contacted: 15, engaged: 10, qualified: 5, booked: 0, won: 0, revenue: 0, currency: 'NGN' },
  contactRate: 75, qualificationRate: 25, bookingRate: 0, closeRate: 0,
  revenuePerLead: 0, revenueRecovered: 0, attributedRevenue: 0,
};

const performance: SdrPerformanceResult[] = [{
  ownerId: 'sdr-1', assigned: 10, completed: 5, slaBreaches: 3, slaAdherenceRate: 70,
  qualified: 2, appointmentsBooked: 1, wins: 0, revenue: 0,
  qualificationRate: 40, bookingRate: 50, closeRate: 0,
}];

function workItem(overrides: Partial<SdrWorkItem> = {}): SdrWorkItem {
  return {
    id: 'item-1', organizationId: 'org-1', leadId: 'lead-1', leadName: 'Ada',
    priorityScore: 95, priorityBand: 'critical', action: 'handoff-closer',
    whyNow: 'Critical revenue opportunity requires immediate human action.',
    whyEscalated: 'Purchase intent', leadState: 'qualified', intent: 'purchase',
    recommendedAction: 'Call now', deadlineAt: '2026-09-15T08:05:00.000Z', slaMinutes: 5,
    slaBreached: true, script: { opening: 'Hi', objective: 'Close', qualificationQuestions: [], objectionResponses: [], closing: 'Next step?' },
    dispositionOptions: ['connected', 'won'], ownerId: 'sdr-1', createdAt: '2026-09-15T08:00:00.000Z', status: 'open',
    ...overrides,
  };
}

describe('buildRevenueControlPlane', () => {
  it('raises critical opportunities and SLA breaches', () => {
    const result = buildRevenueControlPlane({ organizationId: 'org-1', intelligence, workItems: [workItem()], performance, now: '2026-09-15T08:10:00.000Z' });
    expect(result.status).toBe('intervene');
    expect(result.criticalOpenWorkItems).toBe(1);
    expect(result.slaBreaches).toBe(1);
    expect(result.actions.map((item) => item.type)).toEqual(['critical-opportunity', 'sla-breach', 'pipeline-leakage', 'underperforming-owner']);
  });

  it('includes manager escalations and detects pipeline leakage', () => {
    const result = buildRevenueControlPlane({ organizationId: 'org-1', intelligence, workItems: [], performance: [], managerEscalationCount: 2, now: '2026-09-15T08:10:00.000Z' });
    expect(result.openManagerEscalations).toBe(2);
    expect(result.actions.map((item) => item.type)).toContain('manager-escalation');
    expect(result.actions.map((item) => item.type)).toContain('pipeline-leakage');
    expect(result.status).toBe('watch');
  });

  it('does not create exceptions for completed work', () => {
    const result = buildRevenueControlPlane({ organizationId: 'org-1', intelligence: { ...intelligence, funnel: { ...intelligence.funnel, qualified: 0 } }, workItems: [workItem({ status: 'completed' })], performance: [], now: '2026-09-15T08:10:00.000Z' });
    expect(result.actions).toHaveLength(0);
    expect(result.status).toBe('clear');
  });
});
