import { describe, expect, it } from 'vitest';
import { createRevenueAttribution } from '../../src/domain/revenue-attribution';

describe('revenue attribution', () => {
  it('creates revenue only with explicit win evidence', () => {
    const event = createRevenueAttribution({
      id: 'rev_1', organizationId: 'org_1', leadId: 'lead_1', amount: 250000,
      currency: 'NGN', attributionType: 'sdr-assisted', evidence: 'won-outcome',
    });
    expect(event.amount).toBe(250000);
    expect(event.evidence).toBe('won-outcome');
  });

  it('rejects zero or negative revenue', () => {
    expect(() => createRevenueAttribution({
      id: 'rev_1', organizationId: 'org_1', leadId: 'lead_1', amount: 0,
      currency: 'NGN', attributionType: 'direct',
    })).toThrow('amount must be greater than zero');
  });
});
