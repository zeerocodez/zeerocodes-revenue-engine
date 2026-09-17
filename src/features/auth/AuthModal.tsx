import { useState } from 'react';
import { X, Building2, UserCheck, Shield, KeyRound, Check, ArrowRight } from 'lucide-react';
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

export const PRESET_TENANTS = [
  { id: 'zeerocodes-hq', name: 'Zeerocodes Engine HQ', plan: 'Enterprise Pro', industry: 'SaaS & Revenue Ops' },
  { id: 'acme-corp', name: 'Acme Growth Labs', plan: 'Scale Tier', industry: 'B2B Tech & Services' },
  { id: 'lagos-fintech', name: 'Lagos FinTech Partners', plan: 'Enterprise Plus', industry: 'Financial Technology' },
  { id: 'zenith-media', name: 'Zenith Direct Media', plan: 'Growth', industry: 'E-commerce & Ads' },
];

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
  const [selectedTenantId, setSelectedTenantId] = useState(session.tenantId);
  const [selectedUserId, setSelectedUserId] = useState(session.userId);
  const [selectedRole, setSelectedRole] = useState<TenantRole>(session.role);
  const [isSuperAdmin, setIsSuperAdmin] = useState(Boolean(session.isSuperAdmin));

  if (!isOpen) return null;

  const currentTenant = PRESET_TENANTS.find((t) => t.id === selectedTenantId) || PRESET_TENANTS[0];
  const currentUser = PRESET_USERS.find((u) => u.id === selectedUserId) || PRESET_USERS[0];

  const handleApply = () => {
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content dark-modal" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--accent)', color: 'var(--ink)', display: 'grid', placeItems: 'center' }}>
              <Shield size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#fff' }}>Tenant & Role Switcher</h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--dark-muted)' }}>Multi-Tenant SaaS Authentication & Role-Based Access Control</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--dark-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Tenant Switcher */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--dark-text)', marginBottom: '8px' }}>
              <Building2 size={16} color="var(--accent)" /> Select Active Organization (Tenant)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {PRESET_TENANTS.map((tenant) => {
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

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-accent" onClick={handleApply}>
            Switch Workspace <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
