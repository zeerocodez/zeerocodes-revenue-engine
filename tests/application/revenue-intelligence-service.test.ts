import { describe, expect, it } from 'vitest';
import { RevenueIntelligenceService } from '../../src/application/revenue-intelligence-service';

describe('RevenueIntelligenceService', () => {
  it('calculates funnel conversion and recovered revenue', () => {
    const result = new RevenueIntelligenceService().calculate({
      leads: 100, contacted: 80, engaged: 60, qualified: 40, booked: 20, won: 5,
      revenue: 2500000, currency: 'NGN', baselineWon: 3, averageDealValue: 500000,
    });
    expect(result.contactRate).toBe(80);
    expect(result.qualificationRate).toBe(40);
    expect(result.bookingRate).toBe(50);
    expect(result.closeRate).toBe(25);
    expect(result.revenuePerLead).toBe(25000);
    expect(result.revenueRecovered).toBe(1000000);
  });

  it('aggregates only explicit attribution events supplied by the caller', () => {
    const result = new RevenueIntelligenceService().calculate({
      leads: 2, contacted: 2, engaged: 2, qualified: 1, booked: 1, won: 1,
      revenue: 500000, attributionEvents: [
        { id: 'r1', organizationId: 'org_1', leadId: 'l1', amount: 500000, currency: 'NGN', attributionType: 'sdr-assisted', recordedAt: '2026-09-15T08:00:00Z', evidence: 'won-outcome' },
      ],
    });
    expect(result.attributedRevenue).toBe(500000);
  });
});
