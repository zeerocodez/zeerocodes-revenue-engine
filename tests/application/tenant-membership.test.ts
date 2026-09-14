import { describe, expect, it } from 'vitest';
import { TenantMembershipService } from '../../src/application/tenant-membership-service';
import { MemoryTenantMembershipRepository } from '../../src/integrations/memory-tenant-membership';

describe('TenantMembershipService', () => {
  const now = new Date().toISOString();

  function setup() {
    const repository = new MemoryTenantMembershipRepository();
    repository.seedTenant({ id: 'tenant-a', name: 'A', slug: 'a', status: 'active', createdAt: now });
    repository.seedTenant({ id: 'tenant-b', name: 'B', slug: 'b', status: 'active', createdAt: now });
    repository.seedMembership({ id: 'user-1', userId: 'user-1', tenantId: 'tenant-a', email: 'user@example.com', role: 'viewer', active: true, createdAt: now });
    repository.seedMembership({ id: 'admin-1', userId: 'admin-1', tenantId: 'tenant-a', email: 'admin@example.com', role: 'admin', active: true, createdAt: now });
    repository.seedMembership({ id: 'inactive-1', userId: 'inactive-1', tenantId: 'tenant-a', email: 'inactive@example.com', role: 'owner', active: false, createdAt: now });
    return new TenantMembershipService(repository);
  }

  it('returns the membership role rather than trusting a caller-supplied role', async () => {
    const service = setup();
    const membership = await service.authenticate('user-1', 'tenant-a');
    expect(membership.role).toBe('viewer');
    await expect(service.requireRole('user-1', 'tenant-a', 'admin')).rejects.toThrow('Insufficient tenant role');
  });

  it('rejects inactive memberships', async () => {
    const service = setup();
    await expect(service.authenticate('inactive-1', 'tenant-a')).rejects.toThrow('Tenant membership is inactive');
  });

  it('rejects users outside the requested tenant', async () => {
    const service = setup();
    await expect(service.authenticate('user-1', 'tenant-b')).rejects.toThrow('Tenant membership not found');
  });

  it('rejects suspended tenants before membership is evaluated', async () => {
    const repository = new MemoryTenantMembershipRepository();
    repository.seedTenant({ id: 'tenant-s', name: 'Suspended', slug: 'suspended', status: 'suspended', createdAt: now });
    repository.seedMembership({ id: 'owner-1', userId: 'owner-1', tenantId: 'tenant-s', email: 'owner@example.com', role: 'owner', active: true, createdAt: now });
    const service = new TenantMembershipService(repository);
    await expect(service.authenticate('owner-1', 'tenant-s')).rejects.toThrow('Tenant is suspended');
  });
});
