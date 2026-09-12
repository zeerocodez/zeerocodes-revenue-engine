import type { TenantContext, TenantRole } from '../domain/tenant';

const roleRank: Record<TenantRole, number> = {
  viewer: 10,
  agent: 20,
  manager: 30,
  admin: 40,
  owner: 50,
};

export class TenantAccessService {
  assertTenant(context: TenantContext, tenantId: string): void {
    if (!context.tenantId || context.tenantId !== tenantId) throw new Error('Tenant access denied');
  }

  requireRole(context: TenantContext, minimumRole: TenantRole): void {
    if (!context.role || roleRank[context.role] < roleRank[minimumRole]) throw new Error('Insufficient tenant role');
  }

  canReadLead(context: TenantContext): boolean {
    return Boolean(context.tenantId && context.role);
  }

  canManageLead(context: TenantContext): boolean {
    return Boolean(context.role && roleRank[context.role] >= roleRank.agent);
  }
}
