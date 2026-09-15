import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handleRevenueRecovery } from '../../src/application/revenue-recovery-http';

const recovery = { recover: vi.fn() } as any;

beforeEach(() => recovery.recover.mockReset());

describe('revenue recovery HTTP boundary', () => {
  it('derives tenant and owner from authenticated context', async () => {
    recovery.recover.mockResolvedValue({ disposition: 'qualified', lifecycleState: 'qualified' });
    const controlPlane = vi.fn().mockResolvedValue({ status: 'clear' });
    const req = { body: { workItemId: 'w1', disposition: 'qualified' }, context: { tenantId: 'tenant-1', userId: 'user-1', role: 'agent' } } as any;
    const res = { json: vi.fn().mockReturnThis(), status: vi.fn().mockReturnThis() } as any;

    await handleRevenueRecovery(req, res, { recovery, controlPlane });
    expect(recovery.recover).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 'tenant-1', ownerId: 'user-1' }));
    expect(res.json).toHaveBeenCalledWith({ recovery: { disposition: 'qualified', lifecycleState: 'qualified' }, controlPlane: { status: 'clear' } });
  });

  it('rejects an unauthorized role', async () => {
    const req = { body: {}, context: { tenantId: 'tenant-1', userId: 'viewer-1', role: 'viewer' } } as any;
    const res = { json: vi.fn().mockReturnThis(), status: vi.fn().mockReturnThis() } as any;
    await handleRevenueRecovery(req, res, { recovery, controlPlane: vi.fn() });
    expect(res.status).toHaveBeenCalledWith(403);
    expect(recovery.recover).not.toHaveBeenCalled();
  });
});
