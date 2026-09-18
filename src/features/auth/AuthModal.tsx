import { useState, useId } from 'react';
import {
  X,
  Building2,
  UserCheck,
  Shield,
  KeyRound,
  Check,
  ArrowRight,
  Plus,
  Sparkles,
  CreditCard,
  Lock,
  Mail,
  AlertCircle,
  Calendar,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import type { TenantRole } from '../../domain/tenant';
import { sendClientWelcomeEmail } from '../../integrations/email-service';

export interface UserSession {
  userId: string;
  userName: string;
  userEmail: string;
  tenantId: string;
  tenantName: string;
  role: TenantRole;
  isSuperAdmin?: boolean;
  subscriptionPlan: string;
  subscriptionStartDate: string;
  subscriptionExpiresAt: string;
  subscriptionStatus: 'active' | 'expired';
}

export interface ClientAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  tenantId: string;
  tenantName: string;
  industry: string;
  plan: string;
  role: TenantRole;
  subscriptionExpiresAt: string; // ISO string
}

// Default 30-day expiry helper
export function create30DaysFromNow(days = 30): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export const INITIAL_CLIENT_ACCOUNTS: ClientAccount[] = [
  {
    id: 'usr_superadmin_zeerocodes',
    name: 'Zeerocodes Master Admin',
    email: 'zeerocodes@gmail.com',
    password: 'password123',
    tenantId: 'zeerocodes-hq',
    tenantName: 'Zeerocodes Engine HQ',
    industry: 'Revenue Operations & AI Architecture',
    plan: 'SuperAdmin Master Suite (Lifetime)',
    role: 'owner',
    subscriptionExpiresAt: create30DaysFromNow(365),
  },
  {
    id: 'usr_apex',
    name: 'James Montgomery',
    email: 'client@apexpro.com',
    password: 'password123',
    tenantId: 'tenant_apex_pro',
    tenantName: 'Apex Professional Services',
    industry: 'Professional Services & Consulting',
    plan: 'Enterprise Scale (30-Day Pass)',
    role: 'owner',
    subscriptionExpiresAt: create30DaysFromNow(28),
  },
  {
    id: 'usr_acme',
    name: 'David Okonkwo',
    email: 'david@acmelabs.com',
    password: 'password123',
    tenantId: 'acme-corp',
    tenantName: 'Acme Growth Labs',
    industry: 'B2B Tech & Services',
    plan: 'Scale Tier (30-Day Pass)',
    role: 'admin',
    subscriptionExpiresAt: create30DaysFromNow(22),
  },
  {
    id: 'usr_lagos',
    name: 'Folake Adeleke',
    email: 'folake@lagosfintech.com',
    password: 'password123',
    tenantId: 'lagos-fintech',
    tenantName: 'Lagos FinTech Partners',
    industry: 'Financial Technology',
    plan: 'Enterprise Plus (30-Day Pass)',
    role: 'owner',
    subscriptionExpiresAt: create30DaysFromNow(15),
  },
  {
    id: 'usr_sarah_admin',
    name: 'Sarah Alabi (Zeerocodes HQ)',
    email: 'sarah@zeerocodes.com',
    password: 'password123',
    tenantId: 'zeerocodes-hq',
    tenantName: 'Zeerocodes Engine HQ',
    industry: 'Revenue Operations',
    plan: 'Agency Master Suite',
    role: 'owner',
    subscriptionExpiresAt: create30DaysFromNow(30),
  },
  {
    id: 'usr_expired_demo',
    name: 'Marcus Thornton (Lapsed Demo)',
    email: 'expired@demo.com',
    password: 'password123',
    tenantId: 'tenant_expired_demo',
    tenantName: 'Thornton Legal Group',
    industry: 'Corporate Law',
    plan: 'Scale Tier (Expired)',
    role: 'owner',
    subscriptionExpiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Expired 2 days ago
  },
];

export function getDaysRemaining(expiryIso: string): number {
  const expiry = new Date(expiryIso).getTime();
  const now = Date.now();
  const diffMs = expiry - now;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

interface AuthModalProps {
  session: UserSession | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSession: (newSession: UserSession | null) => void;
  initialMode?: 'signin' | 'signup' | 'switch';
}

export default function AuthModal({
  session,
  isOpen,
  onClose,
  onUpdateSession,
  initialMode = 'signin',
}: AuthModalProps) {
  const [activeMode, setActiveMode] = useState<'signin' | 'signup' | 'switch'>(initialMode);

  // Client accounts database
  const [accounts, setAccounts] = useState<ClientAccount[]>(() => {
    const saved = localStorage.getItem('zeero_client_accounts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_CLIENT_ACCOUNTS;
  });

  // Sign-in state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Sign-up state
  const [signupOrgName, setSignupOrgName] = useState('');
  const [signupContactName, setSignupContactName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupIndustry, setSignupIndustry] = useState('Professional Services & Consulting');
  const [signupPlan, setSignupPlan] = useState('Scale Tier (30-Day Pass)');
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Switcher state
  const [selectedAccountId, setSelectedAccountId] = useState(session?.userId || accounts[0].id);

  if (!isOpen) return null;

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const found = accounts.find(
      (acc) => acc.email.toLowerCase() === loginEmail.trim().toLowerCase(),
    );

    if (!found) {
      setLoginError('No client business account found with this email. Please check your email or sign up.');
      return;
    }

    if (found.password !== loginPassword) {
      setLoginError('Invalid password credentials. Please verify your password.');
      return;
    }

    const daysLeft = getDaysRemaining(found.subscriptionExpiresAt);
    const newSession: UserSession = {
      userId: found.id,
      userName: found.name,
      userEmail: found.email,
      tenantId: found.tenantId,
      tenantName: found.tenantName,
      role: found.role,
      isSuperAdmin: found.tenantId === 'zeerocodes-hq',
      subscriptionPlan: found.plan,
      subscriptionStartDate: new Date().toISOString(),
      subscriptionExpiresAt: found.subscriptionExpiresAt,
      subscriptionStatus: daysLeft > 0 ? 'active' : 'expired',
    };

    onUpdateSession(newSession);
    onClose();
  };

  const handleQuickLogin = (acc: ClientAccount) => {
    const daysLeft = getDaysRemaining(acc.subscriptionExpiresAt);
    const newSession: UserSession = {
      userId: acc.id,
      userName: acc.name,
      userEmail: acc.email,
      tenantId: acc.tenantId,
      tenantName: acc.tenantName,
      role: acc.role,
      isSuperAdmin: acc.tenantId === 'zeerocodes-hq',
      subscriptionPlan: acc.plan,
      subscriptionStartDate: new Date().toISOString(),
      subscriptionExpiresAt: acc.subscriptionExpiresAt,
      subscriptionStatus: daysLeft > 0 ? 'active' : 'expired',
    };

    onUpdateSession(newSession);
    onClose();
  };

  const handleClientSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupOrgName.trim() || !signupContactName.trim() || !signupEmail.trim()) return;

    const slug = signupOrgName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newTenantId = `tenant_${slug}_${Math.random().toString(36).slice(2, 6)}`;
    const newUserId = `usr_${Math.random().toString(36).slice(2, 8)}`;
    const expiryDate = create30DaysFromNow(30);

    const newAccount: ClientAccount = {
      id: newUserId,
      name: signupContactName.trim(),
      email: signupEmail.trim(),
      password: signupPassword.trim() || 'password123',
      tenantId: newTenantId,
      tenantName: signupOrgName.trim(),
      industry: signupIndustry,
      plan: signupPlan,
      role: 'owner',
      subscriptionExpiresAt: expiryDate,
    };

    const updatedAccounts = [newAccount, ...accounts];
    setAccounts(updatedAccounts);
    localStorage.setItem('zeero_client_accounts', JSON.stringify(updatedAccounts));

    // Send Welcome Email with Login Credentials
    sendClientWelcomeEmail({
      clientName: newAccount.name,
      clientEmail: newAccount.email,
      businessName: newAccount.tenantName,
      temporaryPassword: newAccount.password,
      planName: newAccount.plan,
      daysActive: 30,
    }).catch(console.error);

    const newSession: UserSession = {
      userId: newAccount.id,
      userName: newAccount.name,
      userEmail: newAccount.email,
      tenantId: newAccount.tenantId,
      tenantName: newAccount.tenantName,
      role: newAccount.role,
      isSuperAdmin: false,
      subscriptionPlan: newAccount.plan,
      subscriptionStartDate: new Date().toISOString(),
      subscriptionExpiresAt: expiryDate,
      subscriptionStatus: 'active',
    };

    setSignupSuccess(true);
    setTimeout(() => {
      onUpdateSession(newSession);
      window.location.hash = 'client-portal';
      onClose();
    }, 600);
  };

  const handleRenewSubscription = (daysToAdd = 30) => {
    if (!session) return;
    const newExpiry = create30DaysFromNow(daysToAdd);
    const updatedAccounts = accounts.map((acc) => {
      if (acc.tenantId === session.tenantId) {
        return { ...acc, subscriptionExpiresAt: newExpiry };
      }
      return acc;
    });
    setAccounts(updatedAccounts);
    localStorage.setItem('zeero_client_accounts', JSON.stringify(updatedAccounts));

    onUpdateSession({
      ...session,
      subscriptionExpiresAt: newExpiry,
      subscriptionStatus: 'active',
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content dark-modal"
        style={{
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.7), 0 0 0 1px rgba(199, 255, 85, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ padding: '16px 22px', borderBottom: '1px solid var(--dark-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '9px',
                background: 'var(--accent)',
                color: 'var(--ink)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Lock size={19} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#fff' }}>
                {activeMode === 'signin'
                  ? 'Client Business Sign In'
                  : activeMode === 'signup'
                  ? 'Register Business & 30-Day Access'
                  : 'Switch Client Account'}
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--dark-muted)' }}>
                Protected Dashboard & 30-Day Subscription Access
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--dark-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', padding: '12px 22px 0 22px', gap: '8px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => {
              setActiveMode('signin');
              setLoginError(null);
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: activeMode === 'signin' ? '1px solid var(--accent)' : '1px solid var(--dark-border)',
              background: activeMode === 'signin' ? 'rgba(199, 255, 85, 0.15)' : 'var(--dark-surface)',
              color: activeMode === 'signin' ? 'var(--accent)' : 'var(--dark-muted)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            🔑 Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveMode('signup');
              setSignupSuccess(false);
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: activeMode === 'signup' ? '1px solid var(--accent)' : '1px solid var(--dark-border)',
              background: activeMode === 'signup' ? 'rgba(199, 255, 85, 0.15)' : 'var(--dark-surface)',
              color: activeMode === 'signup' ? 'var(--accent)' : 'var(--dark-muted)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <Sparkles size={12} color="var(--accent)" /> New Business (30-Day Pass)
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('switch')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: activeMode === 'switch' ? '1px solid var(--accent)' : '1px solid var(--dark-border)',
              background: activeMode === 'switch' ? 'rgba(199, 255, 85, 0.15)' : 'var(--dark-surface)',
              color: activeMode === 'switch' ? 'var(--accent)' : 'var(--dark-muted)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            🏢 Demo Accounts
          </button>
        </div>

        {/* 1. SIGN IN MODE */}
        {activeMode === 'signin' && (
          <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '18px 22px' }}>
              {loginError && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '8px',
                    color: '#f87171',
                    fontSize: '12.5px',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--dark-text)', marginBottom: '5px' }}>
                  Client Work Email
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    required
                    placeholder="client@apexpro.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 34px',
                      borderRadius: '8px',
                      background: 'var(--dark-surface)',
                      border: '1px solid var(--dark-border)',
                      color: '#fff',
                      fontSize: '13px',
                    }}
                  />
                  <Mail size={15} style={{ position: 'absolute', left: '11px', top: '12px', color: 'var(--dark-muted)' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--dark-text)', marginBottom: '5px' }}>
                  Client Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 34px',
                      borderRadius: '8px',
                      background: 'var(--dark-surface)',
                      border: '1px solid var(--dark-border)',
                      color: '#fff',
                      fontSize: '13px',
                    }}
                  />
                  <KeyRound size={15} style={{ position: 'absolute', left: '11px', top: '12px', color: 'var(--dark-muted)' }} />
                </div>
              </div>

              {/* 1-Click Fast Credentials helper */}
              <div style={{ marginTop: '4px', padding: '12px', background: 'rgba(199, 255, 85, 0.05)', borderRadius: '8px', border: '1px solid rgba(199, 255, 85, 0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--accent)' }}>
                    ⚡ 1-Click Demo Client Credentials:
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {accounts.slice(0, 4).map((acc) => {
                    const days = getDaysRemaining(acc.subscriptionExpiresAt);
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => handleQuickLogin(acc)}
                        style={{
                          textAlign: 'left',
                          padding: '7px 10px',
                          background: 'var(--dark-surface)',
                          border: '1px solid var(--dark-border)',
                          borderRadius: '6px',
                          color: '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {acc.tenantName}
                        </div>
                        <div style={{ fontSize: '10px', color: days > 0 ? '#4ade80' : '#f87171' }}>
                          {days > 0 ? `Active (${days}d left)` : 'Expired Demo'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '14px 22px', borderTop: '1px solid var(--dark-border)' }}>
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-accent" style={{ padding: '9px 18px', fontWeight: 700 }}>
                Sign In to Dashboard <ArrowRight size={15} />
              </button>
            </div>
          </form>
        )}

        {/* 2. SIGN UP AS NEW CLIENT */}
        {activeMode === 'signup' && (
          <form onSubmit={handleClientSignUp} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '18px 22px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--dark-text)', marginBottom: '4px' }}>
                  Business / Company Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Professional Services"
                  value={signupOrgName}
                  onChange={(e) => setSignupOrgName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', color: '#fff', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--dark-text)', marginBottom: '4px' }}>
                    Primary Contact Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. James Montgomery"
                    value={signupContactName}
                    onChange={(e) => setSignupContactName(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', color: '#fff', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--dark-text)', marginBottom: '4px' }}>
                    Work Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="client@apexpro.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', color: '#fff', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--dark-text)', marginBottom: '4px' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', color: '#fff', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--dark-text)', marginBottom: '4px' }}>
                    Access Term
                  </label>
                  <div
                    style={{
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: 'rgba(199, 255, 85, 0.1)',
                      border: '1px solid rgba(199, 255, 85, 0.3)',
                      color: 'var(--accent)',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Calendar size={14} /> 30-Day Client Access Pass
                  </div>
                </div>
              </div>

              {signupSuccess && (
                <div style={{ padding: '12px', background: 'rgba(199, 255, 85, 0.15)', border: '1px solid var(--accent)', borderRadius: '8px', color: 'var(--accent)', fontSize: '13px', fontWeight: 700, textAlign: 'center' }}>
                  ✓ Client Business Registered! 30-Day Access Activated. Redirecting...
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ padding: '14px 22px', borderTop: '1px solid var(--dark-border)' }}>
              <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-accent" disabled={signupSuccess} style={{ padding: '9px 18px', fontWeight: 700 }}>
                <Sparkles size={15} /> Create Account & Start 30 Days
              </button>
            </div>
          </form>
        )}

        {/* 3. SWITCH / MANAGE DEMO ACCOUNTS & RENEWAL */}
        {activeMode === 'switch' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '18px 22px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--dark-text)' }}>
                <Building2 size={14} color="var(--accent)" /> All Registered Client Accounts (30-Day Status)
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                {accounts.map((acc) => {
                  const days = getDaysRemaining(acc.subscriptionExpiresAt);
                  const isCurrent = session?.userId === acc.id;
                  const isExpired = days <= 0;

                  return (
                    <div
                      key={acc.id}
                      onClick={() => handleQuickLogin(acc)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: isCurrent ? '1.5px solid var(--accent)' : '1px solid var(--dark-border)',
                        background: isCurrent ? 'rgba(199, 255, 85, 0.08)' : 'var(--dark-surface)',
                        cursor: 'pointer',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{acc.tenantName}</span>
                          <span className={`role-badge ${acc.role}`} style={{ fontSize: '9.5px', padding: '1px 6px' }}>{acc.role}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--dark-muted)', marginTop: '2px' }}>
                          {acc.name} ({acc.email}) • {acc.industry}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: isExpired ? 'rgba(239, 68, 68, 0.15)' : 'rgba(74, 222, 128, 0.15)',
                            color: isExpired ? '#f87171' : '#4ade80',
                          }}
                        >
                          {isExpired ? '⚠️ Expired' : `🟢 ${days} Days Left`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {session && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--dark-border)' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>Current Organization 30-Day Subscription:</div>
                    <div style={{ fontSize: '11px', color: 'var(--dark-muted)' }}>
                      Expires: {new Date(session.subscriptionExpiresAt).toLocaleDateString()} ({getDaysRemaining(session.subscriptionExpiresAt)} days left)
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRenewSubscription(30)}
                    className="btn-accent"
                    style={{ padding: '6px 12px', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '5px' }}
                  >
                    <RefreshCw size={12} /> Renew 30 Days
                  </button>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ padding: '14px 22px', borderTop: '1px solid var(--dark-border)' }}>
              {session && (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateSession(null);
                    onClose();
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#f87171',
                    padding: '7px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <LogOut size={13} /> Sign Out
                </button>
              )}
              <button type="button" className="btn-secondary" onClick={onClose} style={{ marginLeft: 'auto' }}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
