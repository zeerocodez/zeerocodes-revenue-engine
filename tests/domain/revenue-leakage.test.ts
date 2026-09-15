import { describe, expect, it } from 'vitest';
import { detectRevenueLeakage, rankRevenueLeakage } from '../../src/domain/revenue-leakage';

const base = {
  organizationId: 'org_1',
  leadId: 'lead_1',
  createdAt: '2026-09-15T08:00:00.000Z',
  now: '2026-09-16T08:00:00.000Z',
};

describe('revenue leakage detector', () => {
  it('detects a missed response SLA as critical', () => {
    const result = detectRevenueLeakage({ ...base, state: 'new', deadlineAt: '2026-09-15T08:30:00.000Z', estimatedDealValue: 800000 });
    expect(result?.type).toBe('uncontacted');
    expect(result?.severity).toBe('critical');
    expect(result?.estimatedRecoverableRevenue).toBe(800000);
  });

  it('detects qualified opportunities without a booking', () => {
    const result = detectRevenueLeakage({ ...base, state: 'qualified', estimatedDealValue: 2000000 });
    expect(result?.type).toBe('qualified-no-booking');
    expect(result?.severity).toBe('critical');
  });

  it('detects stale engagement but does not invent leakage for active leads', () => {
    const stale = detectRevenueLeakage({ ...base, state: 'engaged' });
    expect(stale?.type).toBe('stalled-engagement');

    const active = detectRevenueLeakage({ ...base, state: 'contacting', lastActivityAt: base.now });
    expect(active).toBeNull();
  });

  it('supports controlled lost-lead resurrection', () => {
    const result = detectRevenueLeakage({ ...base, state: 'lost', lostAt: '2026-09-01T08:00:00.000Z', estimatedDealValue: 600000 });
    expect(result?.type).toBe('stale-lost');
    expect(result?.severity).toBe('medium');
  });

  it('ranks severity before score and value', () => {
    const items = [
      detectRevenueLeakage({ ...base, leadId: 'low', state: 'engaged' })!,
      detectRevenueLeakage({ ...base, leadId: 'critical', state: 'qualified', estimatedDealValue: 2000000 })!,
    ];
    expect(rankRevenueLeakage(items)[0].leadId).toBe('critical');
  });
});
