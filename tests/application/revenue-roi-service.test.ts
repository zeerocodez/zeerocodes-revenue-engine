import { describe, expect, it } from 'vitest';
import { RevenueRoiService } from '../../src/application/revenue-roi-service';

describe('RevenueRoiService', () => {
  it('returns auditable recovery economics', () => {
    const result = new RevenueRoiService().calculate({
      currency: 'NGN',
      estimatedRecoverableRevenue: 4_000_000,
      recoveredRevenue: 1_000_000,
      totalOpportunityValue: 20_000_000,
    });

    expect(result.recoveryRate).toBe(25);
    expect(result.leakageRate).toBe(20);
    expect(result.unrecoveredRevenue).toBe(3_000_000);
  });
});
