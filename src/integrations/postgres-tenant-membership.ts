import type { TenantRecord, TenantUser } from '../domain/tenant';
import type { TenantMembershipRepository } from '../application/tenant-membership-service';
import { PostgresDatabase } from './postgres';

export class PostgresTenantMembershipRepository implements TenantMembershipRepository {
  constructor(private readonly db: PostgresDatabase) {}

  async getUserMembership(userId: string, tenantId: string): Promise<TenantUser | null> {
    const result = await this.db.query<TenantUser>(
      `select id, tenant_id as "tenantId", user_id as "userId", email, role, active, created_at as "createdAt"
       from tenant_users where user_id = $1 and tenant_id = $2 limit 1`,
      [userId, tenantId],
    );
    return result.rows[0] ?? null;
  }

  async getTenant(tenantId: string): Promise<TenantRecord | null> {
    const result = await this.db.query<TenantRecord>(
      `select id, name, slug, status, created_at as "createdAt" from tenants where id = $1 limit 1`,
      [tenantId],
    );
    return result.rows[0] ?? null;
  }

  async upsertTenant(tenant: TenantRecord): Promise<void> {
    await this.db.query(
      `insert into tenants (id, name, slug, status, created_at) values ($1,$2,$3,$4,$5)
       on conflict (id) do update set name=excluded.name, slug=excluded.slug, status=excluded.status`,
      [tenant.id, tenant.name, tenant.slug, tenant.status, tenant.createdAt],
    );
  }

  async upsertMembership(membership: TenantUser): Promise<void> {
    await this.db.query(
      `insert into tenant_users (id, tenant_id, user_id, email, role, active, created_at)
       values ($1,$2,$3,$4,$5,$6,$7)
       on conflict (tenant_id,user_id) do update set email=excluded.email, role=excluded.role, active=excluded.active`,
      [membership.id, membership.tenantId, membership.userId, membership.email, membership.role, membership.active, membership.createdAt],
    );
  }
}
