import type { TenantRecord, TenantRole, TenantUser } from '../domain/tenant';

export interface TenantMembershipRepository {
  getUserMembership(userId: string, tenantId: string): Promise<TenantUser | null>;
  getTenant(tenantId: string): Promise<TenantRecord | null>;
}

export class TenantMembershipService {
  constructor(private readonly repository: TenantMembershipRepository) {}

  async authenticate(userId: string, tenantId: string): Promise<TenantUser> {
    if (!userId.trim()) throw new Error('Authenticated user is required');
    if (!tenantId.trim()) throw new Error('Tenant context is required');

    const tenant = await this.repository.getTenant(tenantId);
    if (!tenant) throw new Error('Tenant not found');
    if (tenant.status !== 'active') throw new Error('Tenant is suspended');

    const membership = await this.repository.getUserMembership(userId, tenantId);
    if (!membership) throw new Error('Tenant membership not found');
    if (!membership.active) throw new Error('Tenant membership is inactive');
    return membership;
  }

  async requireRole(userId: string, tenantId: string, minimumRole: TenantRole): Promise<TenantUser> {
    const membership = await this.authenticate(userId, tenantId);
    const rank: Record<TenantRole, number> = { viewer: 10, agent: 20, manager: 30, admin: 40, owner: 50 };
    if (rank[membership.role] < rank[minimumRole]) throw new Error('Insufficient tenant role');
    return membership;
  }
}
