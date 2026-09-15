import { describe, expect, it, vi } from 'vitest';
import type { PostgresDatabase } from '../../src/integrations/postgres';
import { PostgresRecoveryAttributionStore } from '../../src/integrations/postgres-recovery-attribution';

function dbMock(rows: unknown[] = []): PostgresDatabase {
  return {
    query: vi.fn(async () => ({ rows })),
  } as unknown as PostgresDatabase;
}

describe('PostgresRecoveryAttributionStore', () => {
  it('persists a recovery attribution without changing the audit fields', async () => {
    const db = dbMock();
    const store = new PostgresRecoveryAttributionStore(db);

    await store.save({
      id: 'recovery-1',
      organizationId: 'org-1',
      leadId: 'lead-1',
      leakageOpportunityId: 'org-1_lead-1_qualified-no-booking',
      leakageType: 'qualified-no-booking',
      ownerId: 'sdr-1',
      recoveredAmount: 500_000,
      currency: 'NGN',
      leakageValue: 2_000_000,
      recoveryRate: 25,
      recoveredAt: '2026-09-15T10:00:00.000Z',
      recoverySource: 'sdr',
      evidence: 'won-outcome',
    });

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query.mock.calls[0]?.[0]).toContain('revenue_recovery_attributions');
  });

  it('filters attribution history by tenant and lead', async () => {
    const db = dbMock([{
      id: 'recovery-1', organization_id: 'org-1', lead_id: 'lead-1',
      leakage_opportunity_id: 'leak-1', leakage_type: 'qualified-no-booking', owner_id: 'sdr-1',
      recovered_amount: '500000', currency: 'NGN', leakage_value: '2000000', recovery_rate: '25',
      recovered_at: '2026-09-15T10:00:00.000Z', recovery_source: 'sdr', evidence: 'won-outcome',
    }]);
    const store = new PostgresRecoveryAttributionStore(db);

    const result = await store.listByLead('org-1', 'lead-1');

    expect(result[0]?.recoveryRate).toBe(25);
    expect(result[0]?.recoveredAmount).toBe(500_000);
    expect(db.query.mock.calls[0]?.[0]).toContain('organization_id = $1 and lead_id = $2');
  });
});
