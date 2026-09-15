import { describe, expect, it } from 'vitest';
import { PostgresRevenueControlPlaneReader } from '../../src/integrations/postgres-control-plane';

class FakeDb {
  readonly queries: string[] = [];
  async query<T = any>(text: string): Promise<{ rows: T[] }> {
    this.queries.push(text);
    if (text.includes('with funnel')) {
      return { rows: [{ leads: '10', contacted: '8', engaged: '6', qualified: '3', booked: '0', won: '0', revenue: '0', currency: 'NGN', attributed_revenue: '0', escalations: '1' }] as T[] };
    }
    return { rows: [] as T[] };
  }
}

describe('PostgresRevenueControlPlaneReader', () => {
  it('builds tenant-scoped live metrics and persists a snapshot', async () => {
    const db = new FakeDb();
    const reader = new PostgresRevenueControlPlaneReader(db as never);
    const snapshot = await reader.calculate('org-1', '2026-09-15T08:00:00.000Z');

    expect(snapshot.organizationId).toBe('org-1');
    expect(snapshot.revenue).toBe(0);
    expect(snapshot.openManagerEscalations).toBe(1);
    expect(snapshot.status).toBe('watch');
    expect(snapshot.actions.map((action) => action.type)).toEqual(['manager-escalation', 'pipeline-leakage']);
    expect(db.queries).toHaveLength(2);
  });

  it('rejects missing tenant context before querying', async () => {
    const reader = new PostgresRevenueControlPlaneReader(new FakeDb() as never);
    await expect(reader.calculate('   ')).rejects.toThrow('Tenant context is required');
  });
});
