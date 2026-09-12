export type TenantRole = 'owner' | 'admin' | 'manager' | 'agent' | 'viewer';

export interface TenantRecord {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface TenantUser {
  id: string;
  tenantId: string;
  email: string;
  role: TenantRole;
  active: boolean;
  createdAt: string;
}

export interface TenantContext {
  tenantId: string;
  userId?: string;
  role?: TenantRole;
}

export function assertTenantAccess(resourceTenantId: string, context: TenantContext): void {
  if (!context.tenantId) throw new Error('Tenant context is required');
  if (resourceTenantId !== context.tenantId) throw new Error('Tenant access denied');
}
