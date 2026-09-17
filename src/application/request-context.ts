import type { TenantRole, TenantContext } from '../domain/tenant';
import { TenantMembershipService } from './tenant-membership-service';

export interface AuthenticatedRequestContext extends TenantContext {
  userId: string;
  role: TenantRole;
}

export interface RequestIdentity {
  userId: string;
  tenantId: string;
  /** Optional development-only assertion. Production role comes from membership. */
  role?: TenantRole;
}

export interface IdentityResolver {
  resolve(identity: RequestIdentity): Promise<AuthenticatedRequestContext>;
}

/** Resolves tenant and role from the membership boundary; request headers cannot grant privileges. */
export class MembershipIdentityResolver implements IdentityResolver {
  constructor(private readonly memberships: TenantMembershipService) {}

  async resolve(identity: RequestIdentity): Promise<AuthenticatedRequestContext> {
    const membership = await this.memberships.authenticate(identity.userId, identity.tenantId);
    return { userId: membership.userId, tenantId: membership.tenantId, role: membership.role };
  }
}

/** Temporary adapter retained for isolated tests; do not use for production authentication. */
export class StaticIdentityResolver implements IdentityResolver {
  async resolve(identity: RequestIdentity): Promise<AuthenticatedRequestContext> {
    if (!identity.userId.trim()) throw new Error('Authenticated user is required');
    if (!identity.tenantId.trim()) throw new Error('Tenant context is required');
    if (!identity.role) throw new Error('Tenant role is required');
    return { userId: identity.userId, tenantId: identity.tenantId, role: identity.role };
  }
}

export function requireRole(context: AuthenticatedRequestContext, minimum: TenantRole): void {
  const rank: Record<TenantRole, number> = { viewer: 10, agent: 20, closer: 25, manager: 30, admin: 40, owner: 50 };
  if (rank[context.role] < rank[minimum]) throw new Error('Insufficient tenant role');
}
