import { describe, expect, it } from 'vitest';
import { createRevenueRecoveryAttribution } from '../../src/domain/revenue-recovery-attribution';

describe('revenue recovery attribution', () => {
  it('links recovered revenue to the original leakage opportunity', () => {
    const result = createRevenueRecoveryAttribution({
      id: 'recovery-1',
      organizationId: 'org-1',
      leadId: 'lead-1',
      leakageOpportunityId: 'org-1_lead-1_qualified-no-booking',
      leakageType: 'qualified-no-booking',
      ownerId: 'sdr-1',
      recoveredAmount: 500_000,
      currency: 'NGN',
      leakageValue: 2_000_000,
      recoveredAt: '2026-09-15T10:00:00.000Z',
      recoverySource: 'sdr',
      evidence: 'won-outcome',
    });

    expect(result.recoveryRate).toBe(25);
    expect(result.leakageOpportunityId).toContain('qualified-no-booking');
    expect(result.recoveredAmount).toBe(500_000);
  });

  it('caps recovery rate at 100 percent', () => {
    const result = createRevenueRecoveryAttribution({
      id: 'recovery-2',
      organizationId: 'org-1',
      leadId: 'lead-1',
      leakageOpportunityId: 'org-1_lead-1_qualified-no-booking',
      leakageType: 'qualified-no-booking',
      recoveredAmount: 3_000_000,
      currency: 'NGN',
      leakageValue: 2_000_000,
      recoveredAt: '2026-09-15T10:00:00.000Z',
      recoverySource: 'closer',
      evidence: 'won-outcome',
    });

    expect(result.recoveryRate).toBe(100);
  });
});
