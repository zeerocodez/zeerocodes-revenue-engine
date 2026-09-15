import { describe, expect, it } from 'vitest';
import { SdrPerformanceService } from '../../src/application/sdr-performance-service';

const item = (overrides: Record<string, unknown> = {}) => ({
  id: 'work_1', organizationId: 'org_1', leadId: 'lead_1', leadName: 'Ada', leadState: 'qualified' as const,
  priorityScore: 80, priorityBand: 'high' as const, action: 'call-now' as const,
  whyNow: 'high priority', whyEscalated: 'revenue opportunity', recommendedAction: 'call now',
  deadlineAt: '2026-09-15T08:20:00.000Z', slaMinutes: 20, slaBreached: false,
  script: { opening: 'Hi', objective: 'qualify', qualificationQuestions: [], objectionResponses: [], closing: 'Next step?' },
  dispositionOptions: ['qualified', 'appointment-booked', 'won'] as const,
  ownerId: 'sdr_1', createdAt: '2026-09-15T08:00:00.000Z', status: 'completed' as const,
  disposition: 'qualified' as const, completedAt: '2026-09-15T08:05:00.000Z',
  ...overrides,
});

describe('SDR performance service', () => {
  it('calculates SLA, funnel and revenue metrics for one SDR', () => {
    const service = new SdrPerformanceService();
    const result = service.calculate({ ownerId: 'sdr_1', items: [
      item({ id: 'w1', disposition: 'qualified' }),
      item({ id: 'w2', disposition: 'appointment-booked' }),
      item({ id: 'w3', disposition: 'won', outcomeRevenue: 500000, slaBreached: true }),
    ] });

    expect(result.assigned).toBe(3);
    expect(result.completed).toBe(3);
    expect(result.slaAdherenceRate).toBeCloseTo(66.67, 2);
    expect(result.qualified).toBe(3);
    expect(result.appointmentsBooked).toBe(2);
    expect(result.wins).toBe(1);
    expect(result.revenue).toBe(500000);
    expect(result.closeRate).toBe(50);
  });
});
