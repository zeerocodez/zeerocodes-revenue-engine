import { describe, expect, it } from 'vitest';
import { calculateRevenueRecoveryRoi } from '../../src/domain/revenue-roi';

describe('calculateRevenueRecoveryRoi', () => {
  it('calculates recovery and leakage rates', () => {
    expect(calculateRevenueRecoveryRoi({
      currency: 'NGN',
      estimatedRecoverableRevenue: 2_000_000,
      recoveredRevenue: 500_000,
      totalOpportunityValue: 10_000_000,
    })).toEqual({
      currency: 'NGN',
      estimatedRecoverableRevenue: 2_000_000,
      recoveredRevenue: 500_000,
      recoveryRate: 25,
      identifiedLeakageValue: 2_000_000,
      leakageRate: 20,
      unrecoveredRevenue: 1_500_000,
    });
  });

  it('never reports recovered revenue above identified recoverable value', () => {
    const result = calculateRevenueRecoveryRoi({
      currency: 'NGN',
      estimatedRecoverableRevenue: 100_000,
      recoveredRevenue: 150_000,
    });

    expect(result.recoveredRevenue).toBe(100_000);
    expect(result.recoveryRate).toBe(100);
    expect(result.unrecoveredRevenue).toBe(0);
  });

  it('handles zero denominators safely', () => {
    const result = calculateRevenueRecoveryRoi({
      currency: 'NGN',
      estimatedRecoverableRevenue: 0,
      recoveredRevenue: 0,
      totalOpportunityValue: 0,
    });

    expect(result.recoveryRate).toBe(0);
    expect(result.leakageRate).toBe(0);
  });
});
