import type { TenantRole, TenantContext } from '../domain/tenant';

export interface AuthenticatedRequestContext extends TenantContext {
  userId: string;
  role: TenantRole;
}

export interface RequestIdentity {
  userId: string;
  tenantId: string;
  role: TenantRole;
}

export interface IdentityResolver {
  resolve(identity: RequestIdentity): Promise<AuthenticatedRequestContext>;
}

export class StaticIdentityResolver implements IdentityResolver {
  async resolve(identity: RequestIdentity): Promise<AuthenticatedRequestContext> {
    if (!identity.userId.trim()) throw new Error('Authenticated user is required');
    if (!identity.tenantId.trim()) throw new Error('Tenant context is required');
    return { userId: identity.userId, tenantId: identity.tenantId, role: identity.role };
  }
}

export function requireRole(context: AuthenticatedRequestContext, minimum: TenantRole): void {
  const rank: Record<TenantRole, number> = { viewer: 10, agent: 20, manager: 30, admin: 40, owner: 50 };
  if (rank[context.role] < rank[minimum]) throw new Error('Insufficient tenant role');
}
