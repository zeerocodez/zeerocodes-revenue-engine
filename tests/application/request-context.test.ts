import { describe, expect, it } from 'vitest';
import { requireRole, StaticIdentityResolver } from '../../src/application/request-context';

describe('request context', () => {
  it('resolves an authenticated tenant context', async () => {
    const context = await new StaticIdentityResolver().resolve({
      userId: 'user-1',
      tenantId: 'tenant-a',
      role: 'manager',
    });
    expect(context).toEqual({ userId: 'user-1', tenantId: 'tenant-a', role: 'manager' });
  });

  it('rejects roles below the required minimum', async () => {
    const context = await new StaticIdentityResolver().resolve({
      userId: 'user-1',
      tenantId: 'tenant-a',
      role: 'agent',
    });
    expect(() => requireRole(context, 'manager')).toThrow('Insufficient tenant role');
  });

  it('allows owner to perform every role-gated action', async () => {
    const context = await new StaticIdentityResolver().resolve({
      userId: 'owner-1',
      tenantId: 'tenant-a',
      role: 'owner',
    });
    expect(() => requireRole(context, 'admin')).not.toThrow();
  });
});
