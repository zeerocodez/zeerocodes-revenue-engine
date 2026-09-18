import { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Building2,
  Calendar,
  CheckSquare,
  CircleDollarSign,
  Eye,
  FileText,
  Flame,
  GitBranch,
  Globe,
  Inbox,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  MessageSquare,
  Radio,
  RefreshCw,
  Repeat,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  Users,
  X,
  Zap,
} from 'lucide-react';

import OperationalDashboard from './features/dashboard/OperationalDashboard';
import ClientDashboard from './features/dashboard/ClientDashboard';
import OnboardingWizard from './features/onboarding/OnboardingWizard';
import QualifyLogicWorkspace from './features/revenue-engine/QualifyLogicWorkspace';
import BillingWorkspace from './features/revenue-engine/BillingWorkspace';
import SalesPipelineWorkspace from './features/sales/SalesPipelineWorkspace';
import ActivitiesWorkspace from './features/sales/ActivitiesWorkspace';
import UnifiedInboxWorkspace from './features/inbox/UnifiedInboxWorkspace';
import FollowUpCadenceWorkspace from './features/automation/FollowUpCadenceWorkspace';
import IntegrationsHubWorkspace from './features/integrations/IntegrationsHubWorkspace';
import TemplatesWorkspace from './features/templates/TemplatesWorkspace';
import LeadWorkspace from './features/revenue-engine/LeadWorkspace';
import SdrQueueWorkspace from './features/revenue-engine/SdrQueueWorkspace';
import RevenueAttributionWorkspace from './features/revenue-engine/RevenueAttributionWorkspace';
import SettingsWorkspace from './features/revenue-engine/SettingsWorkspace';
import LeadSourcesWorkspace from './features/revenue-engine/LeadSourcesWorkspace';
import LandingPage from './features/landing/LandingPage';
import AdminClientManagementWorkspace from './features/admin/AdminClientManagementWorkspace';
import AuthModal, {
  type UserSession,
  INITIAL_CLIENT_ACCOUNTS,
  getDaysRemaining,
  create30DaysFromNow,
} from './features/auth/AuthModal';
import SubscriptionLockGate from './features/auth/SubscriptionLockGate';

interface NavItem {
  id: string;
  hash: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
  clientVisible?: boolean;
}

const ALL_NAV_ITEMS: NavItem[] = [
  // Client Visible Tabs
  { id: 'Client Portal', hash: 'client-portal', label: 'Client Portal', icon: BarChart3, clientVisible: true },
  { id: 'Pipeline', hash: 'pipeline', label: 'Booked Deals CRM', icon: Zap, badge: 'Live', clientVisible: true },
  { id: 'Lead Sources', hash: 'lead-sources', label: '07 Lead Sources', icon: Radio, clientVisible: true },
  { id: 'Billing', hash: 'billing', label: '06 Billing & ROI', icon: CircleDollarSign, clientVisible: true },

  // Internal Zeerocodes Ops & Setter Tabs
  { id: 'Admin Control', hash: 'admin-control', label: 'Admin Control', icon: Shield, badge: 'SuperAdmin', clientVisible: false },
  { id: 'Ops Hub', hash: 'operational', label: 'Executive Ops', icon: LayoutDashboard, badge: 'Live', clientVisible: false },
  { id: 'Qualify Logic', hash: 'qualify-logic', label: '08 Qualify Logic', icon: Sparkles, badge: 'AI Brain', clientVisible: false },
  { id: 'Inbox', hash: 'inbox', label: 'Live Inbox & Stream', icon: MessageSquare, badge: '45s', clientVisible: false },
  { id: 'Follow-ups', hash: 'follow-ups', label: '03 Follow-ups', icon: Repeat, clientVisible: false },
  { id: 'Leads', hash: 'leads', label: '05 Lead Database', icon: Inbox, clientVisible: false },
  { id: 'Revenue', hash: 'analytics', label: '04 Analytics', icon: CircleDollarSign, clientVisible: false },
  { id: 'Onboarding', hash: 'onboarding', label: 'Onboarding', icon: ShieldCheck, badge: 'Setup', clientVisible: false },
  { id: 'Integrations', hash: 'integrations', label: 'Integrations Hub', icon: Radio, clientVisible: false },
  { id: 'Templates', hash: 'templates', label: 'Templates', icon: FileText, clientVisible: false },
  { id: 'Settings', hash: 'settings', label: 'Settings', icon: Shield, clientVisible: false },
];

export default function App() {
  const [session, setSession] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('zeero_user_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    const initial = INITIAL_CLIENT_ACCOUNTS[0]; // zeerocodes@gmail.com Super Admin
    return {
      userId: initial.id,
      userName: initial.name,
      userEmail: initial.email,
      tenantId: initial.tenantId,
      tenantName: initial.tenantName,
      role: initial.role,
      isSuperAdmin: true,
      subscriptionPlan: initial.plan,
      subscriptionStartDate: new Date().toISOString(),
      subscriptionExpiresAt: initial.subscriptionExpiresAt,
      subscriptionStatus: 'active',
    };
  });

  // View Mode: 'client' (isolated for external clients) or 'ops' (Zeerocodes agency & setters)
  const [viewMode, setViewMode] = useState<'client' | 'ops'>(() => {
    if (!session) return 'client';
    return session.tenantId === 'zeerocodes-hq' ? 'ops' : 'client';
  });

  const [activeTab, setActiveTab] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (hash === 'admin-control' || hash === 'admin' || hash === 'clients') return 'Admin Control';
    if (hash === 'client-portal' || hash === 'client') return 'Client Portal';
    if (hash === 'operational' || hash === 'overview') return 'Ops Hub';
    if (hash === 'qualify-logic' || hash === 'qualify' || hash === 'rules') return 'Qualify Logic';
    if (hash === 'follow-ups' || hash === 'cadence' || hash === 'automation') return 'Follow-ups';
    if (hash === 'leads' || hash === 'database') return 'Leads';
    if (hash === 'analytics' || hash === 'revenue' || hash === 'reporting') return 'Revenue';
    if (hash === 'billing' || hash === 'subscription') return 'Billing';
    if (hash === 'onboarding' || hash === 'setup') return 'Onboarding';
    if (hash === 'inbox' || hash === 'messages') return 'Inbox';
    if (hash === 'pipeline' || hash === 'deals') return 'Pipeline';
    if (hash === 'lead-sources') return 'Lead Sources';
    if (hash === 'integrations' || hash === 'simulator') return 'Integrations';
    if (hash === 'templates') return 'Templates';
    if (hash === 'settings') return 'Settings';
    return 'Landing';
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup' | 'switch'>('signin');

  const daysRemaining = session ? getDaysRemaining(session.subscriptionExpiresAt) : 0;
  const isSubscriptionExpired = session ? daysRemaining <= 0 : false;

  const handleUpdateSession = (newSession: UserSession | null) => {
    if (newSession === null) {
      setSession(null);
      localStorage.removeItem('zeero_user_session');
      navigateTo('Landing');
      return;
    }

    setSession(newSession);
    localStorage.setItem('zeero_user_session', JSON.stringify(newSession));
    if (newSession.tenantId === 'zeerocodes-hq') {
      setViewMode('ops');
    } else {
      setViewMode('client');
    }

    if (activeTab === 'Landing') {
      navigateTo('Client Portal');
    }
  };

  const handleRenewSubscription = (daysToAdd = 30) => {
    if (!session) return;
    const newExpiry = create30DaysFromNow(daysToAdd);
    const updated: UserSession = {
      ...session,
      subscriptionExpiresAt: newExpiry,
      subscriptionStatus: 'active',
    };
    handleUpdateSession(updated);
  };

  const handleSignOut = () => {
    handleUpdateSession(null);
  };

  const openSignInModal = (mode: 'signin' | 'signup' | 'switch' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const visibleNavItems = ALL_NAV_ITEMS.filter((item) => {
    if (viewMode === 'client') {
      return item.clientVisible;
    }
    return true;
  });

  const navigateTo = (tabName: string) => {
    // Auth Guard: if attempting to visit dashboard without valid session, prompt sign in
    if (tabName !== 'Landing' && !session) {
      openSignInModal('signin');
      return;
    }

    setActiveTab(tabName);
    const item = ALL_NAV_ITEMS.find((n) => n.id === tabName);
    if (item) {
      window.location.hash = item.hash;
    } else if (tabName === 'Landing') {
      window.location.hash = 'landing';
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash === 'landing' || hash === '') setActiveTab('Landing');
      else if (hash === 'admin-control' || hash === 'admin' || hash === 'clients') setActiveTab('Admin Control');
      else if (hash === 'client-portal' || hash === 'client') setActiveTab('Client Portal');
      else if (hash === 'operational' || hash === 'overview') setActiveTab('Ops Hub');
      else if (hash === 'qualify-logic' || hash === 'qualify' || hash === 'rules') setActiveTab('Qualify Logic');
      else if (hash === 'follow-ups' || hash === 'cadence' || hash === 'automation') setActiveTab('Follow-ups');
      else if (hash === 'leads' || hash === 'database') setActiveTab('Leads');
      else if (hash === 'analytics' || hash === 'revenue' || hash === 'reporting') setActiveTab('Revenue');
      else if (hash === 'billing' || hash === 'subscription') setActiveTab('Billing');
      else if (hash === 'onboarding' || hash === 'setup') setActiveTab('Onboarding');
      else if (hash === 'inbox' || hash === 'messages') setActiveTab('Inbox');
      else if (hash === 'pipeline' || hash === 'deals') setActiveTab('Pipeline');
      else if (hash === 'lead-sources') setActiveTab('Lead Sources');
      else if (hash === 'integrations' || hash === 'simulator') setActiveTab('Integrations');
      else if (hash === 'templates') setActiveTab('Templates');
      else if (hash === 'settings') setActiveTab('Settings');
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Landing Page View
  if (activeTab === 'Landing') {
    return (
      <div>
        {session && (
          <div
            style={{
              background: 'var(--ink)',
              color: '#fff',
              padding: '8px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '13px',
              borderBottom: '1px solid var(--dark-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="role-badge superadmin">Zeerocodes Revenue Engine</span>
              <span>
                Signed in as: <strong>{session.tenantName}</strong> ({session.userName})
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: !isSubscriptionExpired ? 'rgba(74, 222, 128, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: !isSubscriptionExpired ? '#4ade80' : '#f87171',
                }}
              >
                {!isSubscriptionExpired ? `🟢 30-Day Access: ${daysRemaining} Days Left` : '⚠️ Subscription Expired'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={() => openSignInModal('switch')}
                style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
              >
                Switch Account
              </button>
              <button
                onClick={() => navigateTo('Client Portal')}
                className="btn-accent"
                style={{ padding: '4px 12px', fontSize: '12px' }}
              >
                Open Dashboard <ArrowRight size={14} />
              </button>
              <button
                onClick={handleSignOut}
                style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        <LandingPage
          session={session}
          onOpenSignIn={() => openSignInModal('signin')}
          onSignOut={handleSignOut}
          onLaunchWorkspace={(tab) => {
            if (!session) {
              openSignInModal('signin');
              return;
            }
            if (tab === 'leads') navigateTo('Leads');
            else if (tab === 'sdr') navigateTo('Inbox');
            else if (tab === 'revenue') navigateTo('Revenue');
            else navigateTo('Client Portal');
          }}
        />

        <AuthModal
          session={session}
          isOpen={isAuthModalOpen}
          initialMode={authModalMode}
          onClose={() => setIsAuthModalOpen(false)}
          onUpdateSession={handleUpdateSession}
        />
      </div>
    );
  }

  // Unauthenticated Guard Screen if user directly lands on a hash URL
  if (!session) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--ink)', display: 'grid', placeItems: 'center', padding: '20px' }}>
        <div style={{ maxWidth: '440px', width: '100%', background: 'var(--dark-card)', border: '1px solid var(--dark-border)', borderRadius: '14px', padding: '32px', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent)', color: 'var(--ink)', display: 'grid', placeItems: 'center', margin: '0 auto 16px auto' }}>
            <Lock size={24} />
          </div>
          <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 800, margin: '0 0 8px 0' }}>Client Sign In Required</h2>
          <p style={{ color: 'var(--dark-text)', fontSize: '13px', margin: '0 0 20px 0', lineHeight: 1.5 }}>
            This business dashboard is restricted to authorized clients with active 30-day subscriptions.
          </p>
          <button onClick={() => openSignInModal('signin')} className="btn-accent" style={{ width: '100%', padding: '10px 16px', fontWeight: 700 }}>
            Sign In with Business Credentials <ArrowRight size={15} />
          </button>
          <button onClick={() => navigateTo('Landing')} className="btn-secondary" style={{ width: '100%', marginTop: '10px', padding: '9px 16px' }}>
            Back to Home
          </button>
        </div>

        <AuthModal
          session={session}
          isOpen={isAuthModalOpen}
          initialMode={authModalMode}
          onClose={() => setIsAuthModalOpen(false)}
          onUpdateSession={handleUpdateSession}
        />
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* Top Application Header */}
      <header className="top-nav">
        <div className="top-nav-left">
          <div className="brand-badge" onClick={() => navigateTo('Landing')}>
            <div className="brand-icon">Z</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>ZEEROCODES</div>
              <div style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 600 }}>REVENUE ENGINE</div>
            </div>
          </div>

          {/* 30-Day Subscription Access Status Badge */}
          <div
            onClick={() => openSignInModal('switch')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '8px',
              background: !isSubscriptionExpired ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.15)',
              border: !isSubscriptionExpired ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.4)',
              cursor: 'pointer',
            }}
            title="Click to manage 30-day subscription"
          >
            <Calendar size={13} color={!isSubscriptionExpired ? '#10b981' : '#f87171'} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: !isSubscriptionExpired ? '#10b981' : '#f87171' }}>
              {!isSubscriptionExpired ? `30d Access: ${daysRemaining} Days Left` : '⚠️ Subscription Expired'}
            </span>
            <span style={{ fontSize: '9.5px', background: 'rgba(0,0,0,0.1)', padding: '1px 4px', borderRadius: '3px', color: 'var(--muted)' }}>
              Renew
            </span>
          </div>

          {/* Role / View Mode Switcher Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(17, 21, 18, 0.08)',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid var(--line)',
              gap: '2px',
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => {
                setViewMode('client');
                if (!['Client Portal', 'Pipeline', 'Lead Sources', 'Billing'].includes(activeTab)) {
                  navigateTo('Client Portal');
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'client' ? '#10b981' : 'transparent',
                color: viewMode === 'client' ? '#fff' : 'var(--muted)',
                cursor: 'pointer',
              }}
            >
              <Eye size={12} /> Client View
            </button>

            <button
              onClick={() => setViewMode('ops')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'ops' ? '#ff5722' : 'transparent',
                color: viewMode === 'ops' ? '#fff' : 'var(--muted)',
                cursor: 'pointer',
              }}
            >
              <Zap size={12} /> Zeerocodes Ops
            </button>
          </div>

          {/* Dynamic Navigation Tabs based on Mode */}
          <nav className="nav-tabs">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  className={`nav-tab-btn ${active ? 'active' : ''}`}
                  onClick={() => navigateTo(item.id)}
                >
                  <Icon size={14} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span style={{ fontSize: '9.5px', background: 'var(--ink)', color: 'var(--accent)', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="top-nav-right">
          {/* Tenant & User Switcher Trigger */}
          <div className="tenant-selector" onClick={() => openSignInModal('switch')} title="Click to switch client organization or renew 30-day access">
            <Building2 size={15} color="var(--accent-deep)" />
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.2 }}>
              <span style={{ fontSize: '12px', fontWeight: 700 }}>{session.tenantName}</span>
              <span style={{ fontSize: '10.5px', color: 'var(--muted)' }}>
                {session.userName} • <strong style={{ textTransform: 'capitalize' }}>{session.role}</strong>
              </span>
            </div>
            <span className={`role-badge ${session.role}`}>{session.role}</span>
          </div>

          <button
            className="btn-secondary"
            style={{ padding: '7px 12px', fontSize: '12px' }}
            onClick={() => navigateTo('Landing')}
          >
            Landing
          </button>

          <button
            onClick={handleSignOut}
            title="Sign Out"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '7px 10px',
              background: 'transparent',
              border: '1px solid var(--line)',
              borderRadius: '6px',
              color: 'var(--muted)',
              fontSize: '11.5px',
              cursor: 'pointer',
            }}
          >
            <LogOut size={13} />
          </button>
        </div>
      </header>

      {/* Main View Router & Subscription Expiration Gate */}
      <main style={{ flex: 1 }}>
        {isSubscriptionExpired ? (
          <SubscriptionLockGate
            session={session}
            onRenew={handleRenewSubscription}
            onSwitchAccount={() => openSignInModal('switch')}
            onSignOut={handleSignOut}
            onBackToLanding={() => navigateTo('Landing')}
          />
        ) : (
          <>
            {activeTab === 'Admin Control' && (
              <AdminClientManagementWorkspace
                session={session}
                onSwitchToClient={(acc) => {
                  handleUpdateSession({
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
                    subscriptionStatus: 'active',
                  });
                  navigateTo('Client Portal');
                }}
              />
            )}
            {activeTab === 'Client Portal' && <ClientDashboard session={session} onNavigate={navigateTo} />}
            {activeTab === 'Ops Hub' && <OperationalDashboard session={session} onNavigate={navigateTo} />}
            {activeTab === 'Qualify Logic' && <QualifyLogicWorkspace session={session} onNavigate={navigateTo} />}
            {activeTab === 'Follow-ups' && <FollowUpCadenceWorkspace session={session} />}
            {activeTab === 'Leads' && <LeadWorkspace session={session} />}
            {activeTab === 'Revenue' && <RevenueAttributionWorkspace session={session} />}
            {activeTab === 'Billing' && <BillingWorkspace session={session} />}
            {activeTab === 'Onboarding' && <OnboardingWizard session={session} onNavigate={navigateTo} />}
            {activeTab === 'Inbox' && <UnifiedInboxWorkspace session={session} />}
            {activeTab === 'Pipeline' && <SalesPipelineWorkspace session={session} />}
            {activeTab === 'Lead Sources' && <LeadSourcesWorkspace session={session} />}
            {activeTab === 'Integrations' && <IntegrationsHubWorkspace session={session} />}
            {activeTab === 'Templates' && <TemplatesWorkspace session={session} />}
            {activeTab === 'Settings' && <SettingsWorkspace />}
          </>
        )}
      </main>

      {/* Auth & Tenant Switcher Modal */}
      <AuthModal
        session={session}
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => setIsAuthModalOpen(false)}
        onUpdateSession={handleUpdateSession}
      />
    </div>
  );
}
