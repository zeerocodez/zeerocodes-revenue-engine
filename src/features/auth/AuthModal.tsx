import { useState } from 'react';
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
} from 'lucide-react';
import type { TenantRole } from '../../domain/tenant';

export interface UserSession {
  userId: string;
  userName: string;
  userEmail: string;
  tenantId: string;
  tenantName: string;
  role: TenantRole;
  isSuperAdmin?: boolean;
}

export interface TenantOption {
  id: string;
  name: string;
  plan: string;
  industry: string;
}

export const INITIAL_PRESET_TENANTS: TenantOption[] = [
  { id: 'zeerocodes-hq', name: 'Zeerocodes Engine HQ', plan: 'Enterprise Pro', industry: 'SaaS & Revenue Ops' },
  { id: 'acme-corp', name: 'Acme Growth Labs', plan: 'Scale Tier', industry: 'B2B Tech & Services' },
  { id: 'lagos-fintech', name: 'Lagos FinTech Partners', plan: 'Enterprise Plus', industry: 'Financial Technology' },
  { id: 'zenith-media', name: 'Zenith Direct Media', plan: 'Growth', industry: 'E-commerce & Ads' },
];

export const PRESET_TENANTS = INITIAL_PRESET_TENANTS;

export const PRESET_USERS: { id: string; name: string; email: string; defaultRole: TenantRole }[] = [
  { id: 'usr_sarah', name: 'Sarah Alabi', email: 'sarah@zeerocodes.com', defaultRole: 'owner' },
  { id: 'usr_david', name: 'David Okonkwo', email: 'david.admin@zeerocodes.com', defaultRole: 'admin' },
  { id: 'usr_emeka', name: 'Emeka Nwosu (Top SDR)', email: 'emeka.sdr@zeerocodes.com', defaultRole: 'agent' },
  { id: 'usr_folake', name: 'Folake Adeleke (Closer)', email: 'folake.deals@zeerocodes.com', defaultRole: 'closer' },
  { id: 'usr_tunde', name: 'Tunde Bakare (Stakeholder)', email: 'tunde@client.com', defaultRole: 'viewer' },
];

interface AuthModalProps {
  session: UserSession;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSession: (newSession: UserSession) => void;
}

export default function AuthModal({ session, isOpen, onClose, onUpdateSession }: AuthModalProps) {
  const [activeMode, setActiveMode] = useState<'switch' | 'signup'>('switch');

  // Switch Mode State
  const [tenants, setTenants] = useState<TenantOption[]>(() => {
    const saved = localStorage.getItem('zeero_registered_tenants');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_PRESET_TENANTS;
  });
  const [selectedTenantId, setSelectedTenantId] = useState(session.tenantId);
  const [selectedUserId, setSelectedUserId] = useState(session.userId);
  const [selectedRole, setSelectedRole] = useState<TenantRole>(session.role);
  const [isSuperAdmin, setIsSuperAdmin] = useState(Boolean(session.isSuperAdmin));

  // New Client Sign-Up Form State
  const [signupOrgName, setSignupOrgName] = useState('');
  const [signupContactName, setSignupContactName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupIndustry, setSignupIndustry] = useState('B2B Tech & Services');
  const [signupPlan, setSignupPlan] = useState('Scale Tier (₦850,000 / mo)');
  const [signupSuccess, setSignupSuccess] = useState(false);

  if (!isOpen) return null;

  const currentTenant = tenants.find((t) => t.id === selectedTenantId) || tenants[0];
  const currentUser = PRESET_USERS.find((u) => u.id === selectedUserId) || PRESET_USERS[0];

  const handleApplySwitch = () => {
    onUpdateSession({
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      tenantId: currentTenant.id,
      tenantName: currentTenant.name,
      role: selectedRole,
      isSuperAdmin,
    });
    onClose();
  };

  const handleClientSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupOrgName.trim() || !signupContactName.trim()) return;

    const slug = signupOrgName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newTenantId = `tenant_${slug}_${Math.random().toString(36).slice(2, 6)}`;
    const newUserId = `usr_${Math.random().toString(36).slice(2, 8)}`;

    const newTenantOption: TenantOption = {
      id: newTenantId,
      name: signupOrgName.trim(),
      plan: signupPlan,
      industry: signupIndustry,
    };

    const updatedTenants = [newTenantOption, ...tenants];
    setTenants(updatedTenants);
    localStorage.setItem('zeero_registered_tenants', JSON.stringify(updatedTenants));

    const newSession: UserSession = {
      userId: newUserId,
      userName: signupContactName.trim(),
      userEmail: signupEmail.trim() || `${slug}@client.com`,
      tenantId: newTenantId,
      tenantName: signupOrgName.trim(),
      role: 'owner',
      isSuperAdmin: false,
    };

    setSignupSuccess(true);
    setTimeout(() => {
      onUpdateSession(newSession);
      window.location.hash = 'client-portal';
      onClose();
    }, 800);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content dark-modal" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--accent)', color: 'var(--ink)', display: 'grid', placeItems: 'center' }}>
              <Shield size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#fff' }}>
                {activeMode === 'switch' ? 'Workspace & Role Switcher' : 'Client Onboarding & Sign-Up'}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--dark-muted)' }}>
                Multi-Tenant SaaS Authentication & Client Portal
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--dark-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div style={{ display: 'flex', padding: '12px 24px 0 24px', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveMode('switch')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: activeMode === 'switch' ? '1px solid var(--accent)' : '1px solid var(--dark-border)',
              background: activeMode === 'switch' ? 'rgba(199, 255, 85, 0.15)' : 'var(--dark-surface)',
              color: activeMode === 'switch' ? 'var(--accent)' : 'var(--dark-muted)',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            🏢 Existing Workspaces & Roles
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('signup')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: activeMode === 'signup' ? '1px solid var(--accent)' : '1px solid var(--dark-border)',
              background: activeMode === 'signup' ? 'rgba(199, 255, 85, 0.15)' : 'var(--dark-surface)',
              color: activeMode === 'signup' ? 'var(--accent)' : 'var(--dark-muted)',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={14} color="var(--accent)" /> Sign Up as New Client
          </button>
        </div>

        {activeMode === 'switch' ? (
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Tenant Selection */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--dark-text)', marginBottom: '8px' }}>
                <Building2 size={16} color="var(--accent)" /> Select Active Organization (Tenant)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {tenants.map((tenant) => {
                  const active = tenant.id === selectedTenantId;
                  return (
                    <div
                      key={tenant.id}
                      onClick={() => setSelectedTenantId(tenant.id)}
                      style={{
                        padding: '12px',
                        borderRadius: '10px',
                        border: active ? '1.5px solid var(--accent)' : '1px solid var(--dark-border)',
                        background: active ? 'rgba(199, 255, 85, 0.08)' : 'var(--dark-surface)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: active ? 'var(--accent)' : '#fff' }}>{tenant.name}</span>
                        {active && <Check size={14} color="var(--accent)" />}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--dark-muted)' }}>{tenant.industry} • <span style={{ color: 'var(--accent)' }}>{tenant.plan}</span></div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* User Persona & Role */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--dark-text)', marginBottom: '8px' }}>
                <UserCheck size={16} color="var(--accent)" /> Select Active User Profile
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {PRESET_USERS.map((user) => {
                  const active = user.id === selectedUserId;
                  return (
                    <div
                      key={user.id}
                      onClick={() => {
                        setSelectedUserId(user.id);
                        setSelectedRole(user.defaultRole);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: active ? '1.5px solid var(--accent)' : '1px solid var(--dark-border)',
                        background: active ? 'rgba(199, 255, 85, 0.08)' : 'var(--dark-surface)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: active ? 'var(--accent)' : 'var(--dark-card)', color: active ? 'var(--ink)' : 'var(--dark-text)', display: 'grid', placeItems: 'center', fontSize: '12px', fontWeight: 800 }}>
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{user.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--dark-muted)' }}>{user.email}</div>
                        </div>
                      </div>
                      <span className={`role-badge ${user.defaultRole}`}>{user.defaultRole}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Role Override & SuperAdmin Mode */}
            <div style={{ padding: '14px', background: 'var(--dark-surface)', borderRadius: '10px', border: '1px solid var(--dark-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <KeyRound size={15} color="var(--accent)" /> Role Permissions Override
                </span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--dark-muted)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isSuperAdmin}
                    onChange={(e) => setIsSuperAdmin(e.target.checked)}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  Global SuperAdmin Mode
                </label>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {(['owner', 'admin', 'manager', 'agent', 'closer', 'viewer'] as TenantRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRole(r)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: selectedRole === r ? '1px solid var(--accent)' : '1px solid var(--dark-border)',
                      background: selectedRole === r ? 'var(--accent)' : 'transparent',
                      color: selectedRole === r ? 'var(--ink)' : 'var(--dark-text)',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                    }}
                  >
                    {r === 'agent' ? 'SDR / Agent' : r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Sign-Up Mode */
          <form onSubmit={handleClientSignUp}>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--dark-text)', marginBottom: '4px' }}>
                  Your Organization / Company Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Global Logistics"
                  value={signupOrgName}
                  onChange={(e) => setSignupOrgName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', color: '#fff', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--dark-text)', marginBottom: '4px' }}>
                    Primary Contact Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kolawole Davies"
                    value={signupContactName}
                    onChange={(e) => setSignupContactName(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', color: '#fff', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--dark-text)', marginBottom: '4px' }}>
                    Work Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. kd@apexlogistics.ng"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', color: '#fff', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--dark-text)', marginBottom: '4px' }}>
                    Industry Sector
                  </label>
                  <select
                    value={signupIndustry}
                    onChange={(e) => setSignupIndustry(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', color: '#fff', fontSize: '13px' }}
                  >
                    <option value="B2B Tech & Services">B2B Tech & Services</option>
                    <option value="Financial Technology">Financial Technology</option>
                    <option value="Real Estate & Construction">Real Estate & Construction</option>
                    <option value="Healthcare & Telemed">Healthcare & Telemed</option>
                    <option value="Solar & Energy">Solar & Clean Energy</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--dark-text)', marginBottom: '4px' }}>
                    Subscription Tier
                  </label>
                  <select
                    value={signupPlan}
                    onChange={(e) => setSignupPlan(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', color: '#fff', fontSize: '13px' }}
                  >
                    <option value="Pilot Tier (₦350,000 / mo)">Pilot Tier (₦350,000 / mo)</option>
                    <option value="Scale Tier (₦850,000 / mo)">Scale Tier (₦850,000 / mo)</option>
                    <option value="Enterprise Plus (₦2,500,000 / mo)">Enterprise Plus (₦2,500,000 / mo)</option>
                  </select>
                </div>
              </div>

              {signupSuccess && (
                <div style={{ padding: '12px', background: 'rgba(199, 255, 85, 0.15)', border: '1px solid var(--accent)', borderRadius: '8px', color: 'var(--accent)', fontSize: '13px', fontWeight: 700, textAlign: 'center' }}>
                  ✓ Organization provisioned! Redirecting to your Client Portal...
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-accent" disabled={signupSuccess}>
                <CreditCard size={15} /> Complete Sign-Up & Launch
              </button>
            </div>
          </form>
        )}

        {activeMode === 'switch' && (
          <div className="modal-footer">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-accent" onClick={handleApplySwitch}>
              Switch Workspace <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
