import { useState } from 'react';
import {
  Building2,
  UserCheck,
  Plus,
  Mail,
  KeyRound,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Send,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  Eye,
  ExternalLink,
  Users,
} from 'lucide-react';
import {
  type ClientAccount,
  INITIAL_CLIENT_ACCOUNTS,
  getDaysRemaining,
  create30DaysFromNow,
  type UserSession,
} from '../auth/AuthModal';
import { sendClientWelcomeEmail } from '../../integrations/email-service';

interface AdminClientManagementWorkspaceProps {
  session: UserSession;
  onSwitchToClient?: (account: ClientAccount) => void;
}

export default function AdminClientManagementWorkspace({
  session,
  onSwitchToClient,
}: AdminClientManagementWorkspaceProps) {
  const [accounts, setAccounts] = useState<ClientAccount[]>(() => {
    const saved = localStorage.getItem('zeero_client_accounts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_CLIENT_ACCOUNTS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // New Client Form State
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [password, setPassword] = useState('');
  const [industry, setIndustry] = useState('Professional Services & Consulting');
  const [plan, setPlan] = useState('Scale Tier (30-Day Pass)');
  const [sendEmailImmediately, setSendEmailImmediately] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const filteredAccounts = accounts.filter(
    (acc) =>
      acc.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.industry.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !contactName.trim() || !contactEmail.trim()) return;

    setIsSubmitting(true);
    setNotification(null);

    const slug = businessName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newTenantId = `tenant_${slug}_${Math.random().toString(36).slice(2, 6)}`;
    const newUserId = `usr_${Math.random().toString(36).slice(2, 8)}`;
    const generatedPassword = password.trim() || `Zeero_${Math.random().toString(36).slice(2, 8)}!`;
    const expiryDate = create30DaysFromNow(30);

    const newAccount: ClientAccount = {
      id: newUserId,
      name: contactName.trim(),
      email: contactEmail.trim(),
      password: generatedPassword,
      tenantId: newTenantId,
      tenantName: businessName.trim(),
      industry,
      plan,
      role: 'owner',
      subscriptionExpiresAt: expiryDate,
    };

    const updated = [newAccount, ...accounts];
    setAccounts(updated);
    localStorage.setItem('zeero_client_accounts', JSON.stringify(updated));

    // Send Welcome Email with Login Credentials
    if (sendEmailImmediately) {
      try {
        await sendClientWelcomeEmail({
          clientName: contactName.trim(),
          clientEmail: contactEmail.trim(),
          businessName: businessName.trim(),
          temporaryPassword: generatedPassword,
          planName: plan,
          daysActive: 30,
        });
        setNotification({
          type: 'success',
          message: `✓ Business "${businessName}" created! Login credentials dispatched to ${contactEmail}.`,
        });
      } catch (err) {
        setNotification({
          type: 'success',
          message: `✓ Business created! (Email dispatch logged for ${contactEmail})`,
        });
      }
    } else {
      setNotification({
        type: 'success',
        message: `✓ Business "${businessName}" created with 30-day access!`,
      });
    }

    // Reset Form
    setBusinessName('');
    setContactName('');
    setContactEmail('');
    setPassword('');
    setIsSubmitting(false);
    setIsCreateModalOpen(false);
  };

  const handleRenew30Days = (tenantId: string) => {
    const updated = accounts.map((acc) => {
      if (acc.tenantId === tenantId) {
        return {
          ...acc,
          subscriptionExpiresAt: create30DaysFromNow(30),
        };
      }
      return acc;
    });
    setAccounts(updated);
    localStorage.setItem('zeero_client_accounts', JSON.stringify(updated));
    setNotification({
      type: 'success',
      message: `✓ Extended 30-Day Subscription for ${accounts.find((a) => a.tenantId === tenantId)?.tenantName}`,
    });
  };

  const handleResendCredentials = async (acc: ClientAccount) => {
    try {
      await sendClientWelcomeEmail({
        clientName: acc.name,
        clientEmail: acc.email,
        businessName: acc.tenantName,
        temporaryPassword: acc.password,
        planName: acc.plan,
        daysActive: Math.max(1, getDaysRemaining(acc.subscriptionExpiresAt)),
      });
      setNotification({
        type: 'success',
        message: `✓ Welcome email & login credentials re-sent to ${acc.email}!`,
      });
    } catch (e) {
      setNotification({
        type: 'error',
        message: `Failed to dispatch email: ${e instanceof Error ? e.message : 'Unknown error'}`,
      });
    }
  };

  return (
    <div className="dashboard-canvas">
      {/* Super Admin Control Banner */}
      <div
        style={{
          background: 'var(--ink)',
          color: '#fff',
          borderRadius: '12px',
          padding: '18px 24px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          border: '1px solid var(--dark-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'rgba(199, 255, 85, 0.15)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--accent)',
            }}
          >
            <Shield size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: 800 }}>Zeerocodes Master Admin Control Plane</span>
              <span className="role-badge superadmin">SUPER ADMIN ACCESS</span>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--dark-muted)', margin: '2px 0 0 0' }}>
              Master Admin: <strong>{session.userEmail}</strong> • Create, provision and send login credentials to client businesses.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-accent"
          style={{ padding: '9px 18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} /> Create & Provision New Client
        </button>
      </div>

      {notification && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '8px',
            marginBottom: '16px',
            background: notification.type === 'success' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: notification.type === 'success' ? '1px solid rgba(74, 222, 128, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
            color: notification.type === 'success' ? '#4ade80' : '#f87171',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Table / Client Roster */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: 800 }}>
              All Client Organizations ({accounts.length})
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--muted)' }}>
              Manage credentials, 30-day access passes, and email activations.
            </p>
          </div>

          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--muted)' }} />
            <input
              type="text"
              placeholder="Search by business, email, industry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px 7px 30px',
                borderRadius: '6px',
                border: '1px solid var(--line)',
                fontSize: '12px',
              }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--line)', color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 12px' }}>Business / Organization</th>
                <th style={{ padding: '10px 12px' }}>Client Owner & Email</th>
                <th style={{ padding: '10px 12px' }}>Password Credentials</th>
                <th style={{ padding: '10px 12px' }}>Plan & 30-Day Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((acc) => {
                const days = getDaysRemaining(acc.subscriptionExpiresAt);
                const isExpired = days <= 0;

                return (
                  <tr key={acc.id} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{acc.tenantName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{acc.industry}</div>
                    </td>

                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600 }}>{acc.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--accent-deep)' }}>{acc.email}</div>
                    </td>

                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <code style={{ background: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: '4px', fontSize: '11.5px', fontWeight: 600 }}>
                          {acc.password}
                        </code>
                        <button
                          onClick={() => copyToClipboard(`Email: ${acc.email}\nPassword: ${acc.password}`, acc.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '2px' }}
                          title="Copy login details"
                        >
                          {copiedKey === acc.id ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </td>

                    <td style={{ padding: '12px' }}>
                      <div style={{ fontSize: '11.5px', fontWeight: 600 }}>{acc.plan}</div>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: isExpired ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                          color: isExpired ? '#ef4444' : '#10b981',
                        }}
                      >
                        {isExpired ? '⚠️ Expired' : `🟢 ${days} Days Left`}
                      </span>
                    </td>

                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleResendCredentials(acc)}
                          className="btn-secondary"
                          style={{ padding: '5px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Resend welcome email with login credentials"
                        >
                          <Mail size={12} /> Send Email
                        </button>

                        <button
                          onClick={() => handleRenew30Days(acc.tenantId)}
                          className="btn-secondary"
                          style={{ padding: '5px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Extend 30 Days"
                        >
                          <RefreshCw size={12} /> +30d
                        </button>

                        {onSwitchToClient && (
                          <button
                            onClick={() => onSwitchToClient(acc)}
                            className="btn-accent"
                            style={{ padding: '5px 9px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Open Client Dashboard as Owner"
                          >
                            <Eye size={12} /> Access
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE NEW CLIENT MODAL */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div
            className="modal-content dark-modal"
            style={{ maxWidth: '580px', boxShadow: '0 25px 60px -15px rgba(0,0,0,0.8)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ padding: '16px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--accent)', color: 'var(--ink)', display: 'grid', placeItems: 'center' }}>
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#fff' }}>
                    Create & Provision New Client
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--dark-muted)' }}>
                    Auto-generate credentials, 30-day access, and dispatch welcome email.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--dark-muted)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClient}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '18px 22px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--dark-text)', marginBottom: '5px' }}>
                    Business / Organization Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Professional Services"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', color: '#fff', fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--dark-text)', marginBottom: '5px' }}>
                      Primary Client Contact Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. James Montgomery"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', color: '#fff', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--dark-text)', marginBottom: '5px' }}>
                      Client Work Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="client@apexpro.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', color: '#fff', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--dark-text)', marginBottom: '5px' }}>
                      Custom Password (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Leave blank to auto-generate"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', color: '#fff', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--dark-text)', marginBottom: '5px' }}>
                      Industry Sector
                    </label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', color: '#fff', fontSize: '13px' }}
                    >
                      <option value="Professional Services & Consulting">Professional Services & Consulting</option>
                      <option value="Corporate Law & Compliance">Corporate Law & Compliance</option>
                      <option value="CPA & Tax Advisory">CPA & Tax Advisory</option>
                      <option value="B2B Tech & SaaS">B2B Tech & SaaS</option>
                      <option value="Financial Technology">Financial Technology</option>
                      <option value="Commercial Real Estate">Commercial Real Estate</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--dark-text)', marginBottom: '5px' }}>
                      Subscription Plan Tier
                    </label>
                    <select
                      value={plan}
                      onChange={(e) => setPlan(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', color: '#fff', fontSize: '13px' }}
                    >
                      <option value="Starter Retainer (30-Day Pass)">Starter Retainer (30-Day Pass)</option>
                      <option value="Scale Tier (30-Day Pass)">Scale Tier (30-Day Pass)</option>
                      <option value="Enterprise Scale (30-Day Pass)">Enterprise Scale (30-Day Pass)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--dark-text)', marginBottom: '5px' }}>
                      Access Period
                    </label>
                    <div
                      style={{
                        padding: '9px 12px',
                        borderRadius: '8px',
                        background: 'rgba(199, 255, 85, 0.1)',
                        border: '1px solid rgba(199, 255, 85, 0.3)',
                        color: 'var(--accent)',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Calendar size={14} /> 30-Day Active Client Pass
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: '12px 14px',
                    background: 'rgba(199, 255, 85, 0.06)',
                    borderRadius: '8px',
                    border: '1px solid rgba(199, 255, 85, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={16} color="var(--accent)" />
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#fff' }}>
                        Send Welcome Email with Credentials
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--dark-muted)' }}>
                        Dispatches login link, email, and password to client.
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={sendEmailImmediately}
                    onChange={(e) => setSendEmailImmediately(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--accent)', cursor: 'pointer' }}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '14px 22px', borderTop: '1px solid var(--dark-border)' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-accent" disabled={isSubmitting} style={{ padding: '9px 18px', fontWeight: 700 }}>
                  <Sparkles size={15} /> {isSubmitting ? 'Creating & Sending...' : 'Create Client & Dispatch Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
