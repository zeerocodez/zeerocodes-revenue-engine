import { describe, expect, it } from 'vitest';
import { buildWeeklyRevenueReport } from '../../src/domain/revenue-report';

const result = {
  funnel: { leads: 100, contacted: 90, engaged: 70, qualified: 50, booked: 20, won: 5, revenue: 2500000, currency: 'NGN' },
  contactRate: 90,
  qualificationRate: 50,
  bookingRate: 40,
  closeRate: 25,
  revenuePerLead: 25000,
  revenueRecovered: 1000000,
  attributedRevenue: 1000000,
};

describe('buildWeeklyRevenueReport', () => {
  it('produces client-facing highlights and no false risks when metrics are healthy', () => {
    const report = buildWeeklyRevenueReport('2026-09-07', '2026-09-13', result);
    expect(report.currency).toBe('NGN');
    expect(report.revenue).toBe(2500000);
    expect(report.revenueRecovered).toBe(1000000);
    expect(report.highlights).toEqual(expect.arrayContaining([
      'Recovered 1,000,000 in incremental revenue.',
      'Closed 25% of booked opportunities.',
      'Reached 90% of captured leads.',
    ]));
    expect(report.risks).toEqual([]);
  });
});
