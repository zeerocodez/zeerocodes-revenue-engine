import { describe, expect, it } from 'vitest';
import { PostgresRevenueControlPlaneReader } from '../../src/integrations/postgres-control-plane';

describe('PostgresRevenueControlPlaneReader ROI metrics', () => {
  it('reads recovered revenue from recovery attribution and uses one activity row per lead', async () => {
    const queries: string[] = [];
    const db = {
      async query<T = unknown>(sql: string): Promise<{ rows: T[] }> {
        queries.push(sql);
        if (sql.includes('with funnel')) {
          return { rows: [{ leads: '10', contacted: '8', engaged: '7', qualified: '5', booked: '3', won: '2', revenue: '2000000', currency: 'NGN', attributed_revenue: '2000000', recovered_revenue: '500000', escalations: '0' }] as T[] };
        }
        if (sql.includes('left join lateral')) {
          return { rows: [{ id: 'lead-1', organization_id: 'org-1', state: 'qualified', created_at: '2026-09-15T08:00:00.000Z', updated_at: '2026-09-15T08:00:00.000Z', profile: { estimatedDealValue: 2000000 }, metadata: {}, last_activity_at: '2026-09-15T09:00:00.000Z', appointment_completed: false, lost_at: null }] as T[] };
        }
        return { rows: [] as T[] };
      },
    };

    const reader = new PostgresRevenueControlPlaneReader(db);
    const snapshot = await reader.calculate('org-1', '2026-09-15T10:00:00.000Z');

    expect(snapshot.revenueRecovered).toBe(500000);
    expect(snapshot.estimatedRecoverableRevenue).toBe(2000000);
    expect(snapshot.revenueLeakCount).toBe(1);
    expect(queries.some((sql) => sql.includes('left join lateral'))).toBe(true);
  });
});
