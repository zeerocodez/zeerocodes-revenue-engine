import { createHmac, timingSafeEqual } from 'node:crypto';
import type { TenantMembershipService } from './tenant-membership-service';
import type { AuthenticatedRequestContext } from './request-context';

interface SessionClaims {
  sub: string;
  tenant_id: string;
  iat: number;
  exp: number;
}

function secretValue(secret?: string): string {
  return secret ?? process.env.SESSION_SECRET ?? 'zeerocodes-default-secure-session-secret-key-2026';
}

function base64url(value: string): string {
  return Buffer.from(value).toString('base64url');
}

function decode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

export function signSession(userId: string, tenantId: string, secret?: string): string {
  const key = secretValue(secret);
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(
    JSON.stringify({
      sub: userId,
      tenant_id: tenantId,
      iat: now,
      exp: now + Number(process.env.SESSION_TTL_SECONDS ?? 86400),
    }),
  );
  const unsigned = `${header}.${payload}`;
  return `${unsigned}.${createHmac('sha256', key).update(unsigned).digest('base64url')}`;
}

export function verifySession(token: string, secret?: string): SessionClaims {
  const key = secretValue(secret);
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid session token');
  const unsigned = `${parts[0]}.${parts[1]}`;
  const expected = createHmac('sha256', key).update(unsigned).digest();
  const actual = Buffer.from(parts[2], 'base64url');
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new Error('Invalid session signature');
  }
  const claims = JSON.parse(decode(parts[1])) as SessionClaims;
  if (!claims.sub || !claims.tenant_id || !claims.exp || claims.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error('Session expired');
  }
  return claims;
}

export class SessionIdentityResolver {
  constructor(private readonly memberships: TenantMembershipService) {}

  async resolveBearer(token: string): Promise<AuthenticatedRequestContext> {
    const claims = verifySession(token);
    const membership = await this.memberships.authenticate(claims.sub, claims.tenant_id);
    return {
      userId: membership.userId,
      tenantId: membership.tenantId,
      role: membership.role,
    };
  }
}
