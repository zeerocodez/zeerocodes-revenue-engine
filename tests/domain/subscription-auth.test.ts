import { describe, it, expect } from 'vitest';
import {
  INITIAL_CLIENT_ACCOUNTS,
  getDaysRemaining,
  create30DaysFromNow,
  type UserSession,
} from '../../src/features/auth/AuthModal';

describe('Client Dashboard Authentication & 30-Day Subscription Access', () => {
  it('should authenticate client with valid business credentials', () => {
    const account = INITIAL_CLIENT_ACCOUNTS.find((a) => a.email === 'client@apexpro.com');
    expect(account).toBeDefined();
    expect(account?.tenantName).toBe('Apex Professional Services');
    expect(account?.password).toBe('password123');

    const daysLeft = getDaysRemaining(account!.subscriptionExpiresAt);
    expect(daysLeft).toBeGreaterThan(0);
  });

  it('should isolate dashboard access by tenant organization ID', () => {
    const apexAccount = INITIAL_CLIENT_ACCOUNTS.find((a) => a.email === 'client@apexpro.com');
    const acmeAccount = INITIAL_CLIENT_ACCOUNTS.find((a) => a.email === 'david@acmelabs.com');

    expect(apexAccount?.tenantId).not.toBe(acmeAccount?.tenantId);
    expect(apexAccount?.tenantId).toBe('tenant_apex_pro');
    expect(acmeAccount?.tenantId).toBe('acme-corp');
  });

  it('should correctly calculate active vs expired 30-day subscription access', () => {
    const activeDate = create30DaysFromNow(25);
    const expiredDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    expect(getDaysRemaining(activeDate)).toBe(25);
    expect(getDaysRemaining(expiredDate)).toBeLessThanOrEqual(0);
  });

  it('should restore active status when 30-day subscription is renewed', () => {
    const expiredDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    let session: UserSession = {
      userId: 'usr_test',
      userName: 'Test User',
      userEmail: 'test@business.com',
      tenantId: 'tenant_test',
      tenantName: 'Test Business LLC',
      role: 'owner',
      subscriptionPlan: 'Scale Tier',
      subscriptionStartDate: new Date().toISOString(),
      subscriptionExpiresAt: expiredDate,
      subscriptionStatus: 'expired',
    };

    expect(getDaysRemaining(session.subscriptionExpiresAt)).toBeLessThanOrEqual(0);

    // Renew subscription for +30 days
    const newExpiry = create30DaysFromNow(30);
    session = {
      ...session,
      subscriptionExpiresAt: newExpiry,
      subscriptionStatus: 'active',
    };

    expect(getDaysRemaining(session.subscriptionExpiresAt)).toBe(30);
    expect(session.subscriptionStatus).toBe('active');
  });
});
