import type { TenantRecord, TenantUser } from '../domain/tenant';
import type { TenantMembershipRepository } from '../application/tenant-membership-service';

export class MemoryTenantMembershipRepository implements TenantMembershipRepository {
  private readonly tenants = new Map<string, TenantRecord>();
  private readonly memberships = new Map<string, TenantUser>();

  seedTenant(tenant: TenantRecord): void {
    this.tenants.set(tenant.id, structuredClone(tenant));
  }

  seedMembership(membership: TenantUser): void {
    this.memberships.set(`${membership.userId}:${membership.tenantId}`, structuredClone(membership));
  }

  async getUserMembership(userId: string, tenantId: string): Promise<TenantUser | null> {
    const membership = this.memberships.get(`${userId}:${tenantId}`);
    return membership ? structuredClone(membership) : null;
  }

  async getTenant(tenantId: string): Promise<TenantRecord | null> {
    const tenant = this.tenants.get(tenantId);
    return tenant ? structuredClone(tenant) : null;
  }
}
