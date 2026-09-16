import { describe, expect, it } from 'vitest';
import { calculateRecoveryRate, createRecoveryAttribution } from '../../src/domain/recovery-attribution';

describe('Recovery Attribution Domain', () => {
  it('caps recovery rate strictly at 100%', () => {
    // If recovered 150,000 against 100,000 leakage, rate must cap at 100%
    const rateOver = calculateRecoveryRate(150_000, 100_000);
    expect(rateOver).toBe(100);

    // Normal partial recovery
    const ratePartial = calculateRecoveryRate(50_000, 100_000);
    expect(ratePartial).toBe(50);

    // Full recovery
    const rateExact = calculateRecoveryRate(100_000, 100_000);
    expect(rateExact).toBe(100);
  });

  it('handles zero or negative denominator gracefully without NaN', () => {
    const rateZero = calculateRecoveryRate(50_000, 0);
    // When leakage value is 0 or missing, recovers 100% of recovered amount
    expect(rateZero).toBe(100);

    const rateZeroRecovered = calculateRecoveryRate(0, 100_000);
    expect(rateZeroRecovered).toBe(0);
  });

  it('creates a validated recovery attribution record', () => {
    const record = createRecoveryAttribution({
      id: 'rec-1',
      organizationId: 'tenant-1',
      leadId: 'lead-1',
      leakageOpportunityId: 'leak-1',
      leakageType: 'qualified-no-booking',
      ownerId: 'sdr-1',
      recoveredAmount: 120_000,
      currency: 'NGN',
      leakageValue: 150_000,
      recoverySource: 'sdr',
      evidence: 'won-outcome',
    });

    expect(record.id).toBe('rec-1');
    expect(record.recoveryRate).toBe(80); // (120,000 / 150,000) * 100
    expect(record.evidence).toBe('won-outcome');
    expect(record.recoveredAmount).toBe(120_000);
  });

  it('rejects invalid inputs missing required tenant, lead or owner fields', () => {
    expect(() =>
      createRecoveryAttribution({
        id: 'rec-1',
        organizationId: '',
        leadId: 'lead-1',
        leakageOpportunityId: 'leak-1',
        leakageType: 'uncontacted',
        ownerId: 'sdr-1',
        recoveredAmount: 50_000,
      }),
    ).toThrow('organizationId is required');

    expect(() =>
      createRecoveryAttribution({
        id: 'rec-1',
        organizationId: 'tenant-1',
        leadId: 'lead-1',
        leakageOpportunityId: 'leak-1',
        leakageType: 'uncontacted',
        ownerId: 'sdr-1',
        recoveredAmount: 0,
      }),
    ).toThrow('recoveredAmount must be greater than zero');
  });
});
