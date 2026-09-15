import { beforeEach, describe, expect, it, vi } from 'vitest';
import { recoverRevenue } from '../../src/lib/revenue-recovery-api';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);
const storage = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
  clear: () => storage.clear(),
});

beforeEach(() => {
  fetchMock.mockReset();
  storage.clear();
});

describe('recoverRevenue API client', () => {
  it('posts the recovery request and returns the refreshed control plane', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: 'dev-token', tenantId: 'tenant-1' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        recovery: { disposition: 'qualified', lifecycleState: 'qualified', transitioned: false, revenueRecorded: false, revenueAmount: 0, duplicateRevenue: false, workItem: { id: 'w1' } },
        controlPlane: { organizationId: 'tenant-1', currency: 'NGN', revenue: 0, revenueRecovered: 0, revenuePerLead: 0, criticalOpenWorkItems: 0, slaBreaches: 0, openManagerEscalations: 0, atRiskOwners: [], actions: [], status: 'clear', generatedAt: '2026-09-15T00:00:00.000Z' },
      }), { status: 200, headers: { 'content-type': 'application/json' } }));

    const result = await recoverRevenue({ workItemId: 'w1', disposition: 'qualified' });
    expect(result.recovery.disposition).toBe('qualified');
    expect(result.controlPlane.status).toBe('clear');
    expect(fetchMock).toHaveBeenLastCalledWith('/api/revenue/recovery', expect.objectContaining({ method: 'POST' }));
  });

  it('surfaces server errors', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: 'dev-token', tenantId: 'tenant-1' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Insufficient tenant role' }), { status: 403 }));
    await expect(recoverRevenue({ workItemId: 'w1', disposition: 'won', outcomeRevenue: 100000, currency: 'NGN' })).rejects.toThrow('Insufficient tenant role');
  });
});
