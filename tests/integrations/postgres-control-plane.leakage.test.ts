import { describe, expect, it } from 'vitest';
import { PostgresRevenueControlPlaneReader } from '../../src/integrations/postgres-control-plane';

function dbMock() {
  let persisted: unknown[] = [];
  return {
    persisted,
    async query<T = unknown>(sql: string): Promise<{ rows: T[] }> {
      if (sql.includes('from leads l')) {
        return {
          rows: [{
            id: 'lead-1', organization_id: 'org-1', state: 'qualified',
            created_at: '2026-09-14T08:00:00.000Z', updated_at: '2026-09-14T09:00:00.000Z',
            profile: { estimatedDealValue: 2000000 }, metadata: {},
            last_activity_at: '2026-09-14T09:00:00.000Z', appointment_completed: false, lost_at: null,
          } as T],
        };
      }
      if (sql.includes('insert into revenue_control_snapshots')) {
        persisted.push(sql);
        return { rows: [] as T[] };
      }
      return {
        rows: [{
          leads: '1', contacted: '1', engaged: '1', qualified: '1', booked: '0', won: '0',
          revenue: '0', currency: 'NGN', attributed_revenue: '0', escalations: '0',
        } as T],
      };
    },
  };
}

describe('PostgresRevenueControlPlaneReader leakage integration', () => {
  it('turns a live qualified lead into a recoverable revenue control action', async () => {
    const db = dbMock();
    const reader = new PostgresRevenueControlPlaneReader(db as never);

    const snapshot = await reader.calculate('org-1', '2026-09-15T09:00:00.000Z');

    expect(snapshot.revenueLeakCount).toBe(1);
    expect(snapshot.estimatedRecoverableRevenue).toBe(2_000_000);
    expect(snapshot.actions).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'revenue-leak', leadId: 'lead-1', severity: 'critical' }),
    ]));
    expect(snapshot.status).toBe('intervene');
    expect(db.persisted).toHaveLength(1);
  });
});
