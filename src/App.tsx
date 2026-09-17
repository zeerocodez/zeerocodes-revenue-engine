import { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Building2,
  Calendar,
  CheckSquare,
  CircleDollarSign,
  FileText,
  Flame,
  GitBranch,
  Globe,
  Inbox,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Radio,
  Repeat,
  Shield,
  ShieldCheck,
  Sparkles,
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
import AuthModal, { type UserSession, PRESET_TENANTS, PRESET_USERS } from './features/auth/AuthModal';

interface NavItem {
  id: string;
  hash: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}

const navItems: NavItem[] = [
  { id: 'Ops Hub', hash: 'operational', label: 'Executive Ops', icon: LayoutDashboard, badge: 'Live' },
  { id: 'Client Portal', hash: 'client-portal', label: 'Client Portal', icon: BarChart3 },
  { id: 'Qualify Logic', hash: 'qualify-logic', label: '08 Qualify Logic', icon: Sparkles, badge: 'AI Brain' },
  { id: 'Follow-ups', hash: 'follow-ups', label: '03 Follow-ups', icon: Repeat },
  { id: 'Leads', hash: 'leads', label: '05 Lead Database', icon: Inbox },
  { id: 'Revenue', hash: 'analytics', label: '04 Analytics', icon: CircleDollarSign },
  { id: 'Billing', hash: 'billing', label: '06 Billing', icon: CircleDollarSign },
  { id: 'Inbox', hash: 'inbox', label: 'Live Inbox', icon: MessageSquare, badge: 'AI' },
  { id: 'Pipeline', hash: 'pipeline', label: 'Deals CRM', icon: Zap, badge: 'Sales' },
  { id: 'Onboarding', hash: 'onboarding', label: 'Onboarding', icon: ShieldCheck, badge: 'Setup' },
  { id: 'Integrations', hash: 'integrations', label: '07 Integrations', icon: Radio },
  { id: 'Templates', hash: 'templates', label: 'Templates', icon: FileText },
  { id: 'Settings', hash: 'settings', label: 'Settings', icon: Shield },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (hash === 'operational' || hash === 'overview') return 'Ops Hub';
    if (hash === 'client-portal' || hash === 'client') return 'Client Portal';
    if (hash === 'qualify-logic' || hash === 'qualify' || hash === 'rules') return 'Qualify Logic';
    if (hash === 'follow-ups' || hash === 'cadence' || hash === 'automation') return 'Follow-ups';
    if (hash === 'leads' || hash === 'database') return 'Leads';
    if (hash === 'analytics' || hash === 'revenue' || hash === 'reporting') return 'Revenue';
    if (hash === 'billing' || hash === 'subscription') return 'Billing';
    if (hash === 'onboarding' || hash === 'setup') return 'Onboarding';
    if (hash === 'inbox' || hash === 'messages') return 'Inbox';
    if (hash === 'pipeline' || hash === 'deals') return 'Pipeline';
    if (hash === 'integrations' || hash === 'simulator') return 'Integrations';
    if (hash === 'templates') return 'Templates';
    if (hash === 'settings') return 'Settings';
    return 'Landing';
  });

  const [session, setSession] = useState<UserSession>(() => {
    const saved = localStorage.getItem('zeero_user_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      userId: PRESET_USERS[0].id,
      userName: PRESET_USERS[0].name,
      userEmail: PRESET_USERS[0].email,
      tenantId: PRESET_TENANTS[0].id,
      tenantName: PRESET_TENANTS[0].name,
      role: PRESET_USERS[0].defaultRole,
      isSuperAdmin: true,
    };
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleUpdateSession = (newSession: UserSession) => {
    setSession(newSession);
    localStorage.setItem('zeero_user_session', JSON.stringify(newSession));
  };

  const navigateTo = (tabName: string) => {
    setActiveTab(tabName);
    const item = navItems.find((n) => n.id === tabName);
    if (item) {
      window.location.hash = item.hash;
    } else if (tabName === 'Landing') {
      window.location.hash = 'landing';
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash === 'landing' || hash === '') setActiveTab('Landing');
      else if (hash === 'operational' || hash === 'overview') setActiveTab('Ops Hub');
      else if (hash === 'client-portal' || hash === 'client') setActiveTab('Client Portal');
      else if (hash === 'qualify-logic' || hash === 'qualify' || hash === 'rules') setActiveTab('Qualify Logic');
      else if (hash === 'follow-ups' || hash === 'cadence' || hash === 'automation') setActiveTab('Follow-ups');
      else if (hash === 'leads' || hash === 'database') setActiveTab('Leads');
      else if (hash === 'analytics' || hash === 'revenue' || hash === 'reporting') setActiveTab('Revenue');
      else if (hash === 'onboarding' || hash === 'setup') setActiveTab('Onboarding');
      else if (hash === 'inbox' || hash === 'messages') setActiveTab('Inbox');
      else if (hash === 'pipeline' || hash === 'deals') setActiveTab('Pipeline');
      else if (hash === 'integrations' || hash === 'simulator') setActiveTab('Integrations');
      else if (hash === 'templates') setActiveTab('Templates');
      else if (hash === 'settings') setActiveTab('Settings');
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Landing Page
  if (activeTab === 'Landing') {
    return (
      <div>
        <div style={{ background: 'var(--ink)', color: '#fff', padding: '8px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', borderBottom: '1px solid var(--dark-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="role-badge superadmin">Unified Revenue Engine</span>
            <span>Organization: <strong>{session.tenantName}</strong> ({session.userName})</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
            >
              Switch Workspace
            </button>
            <button
              onClick={() => navigateTo('Ops Hub')}
              className="btn-accent"
              style={{ padding: '4px 12px', fontSize: '12px' }}
            >
              Launch Engine <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <LandingPage onLaunchWorkspace={(tab) => {
          if (tab === 'leads') navigateTo('Leads');
          else if (tab === 'sdr') navigateTo('SDR Queue');
          else if (tab === 'revenue') navigateTo('Revenue');
          else navigateTo('Ops Hub');
        }} />

        <AuthModal
          session={session}
          isOpen={isAuthModalOpen}
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

          <nav className="nav-tabs">
            {navItems.map((item) => {
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
          <div className="tenant-selector" onClick={() => setIsAuthModalOpen(true)}>
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
        </div>
      </header>

      {/* Main View Router */}
      <main style={{ flex: 1 }}>
        {activeTab === 'Ops Hub' && <OperationalDashboard session={session} onNavigate={navigateTo} />}
        {activeTab === 'Client Portal' && <ClientDashboard session={session} onNavigate={navigateTo} />}
        {activeTab === 'Qualify Logic' && <QualifyLogicWorkspace session={session} onNavigate={navigateTo} />}
        {activeTab === 'Follow-ups' && <FollowUpCadenceWorkspace session={session} />}
        {activeTab === 'Leads' && <LeadWorkspace session={session} />}
        {activeTab === 'Revenue' && <RevenueAttributionWorkspace session={session} />}
        {activeTab === 'Billing' && <BillingWorkspace session={session} />}
        {activeTab === 'Onboarding' && <OnboardingWizard session={session} onNavigate={navigateTo} />}
        {activeTab === 'Inbox' && <UnifiedInboxWorkspace session={session} />}
        {activeTab === 'Pipeline' && <SalesPipelineWorkspace session={session} />}
        {activeTab === 'Integrations' && <IntegrationsHubWorkspace session={session} />}
        {activeTab === 'Templates' && <TemplatesWorkspace session={session} />}
        {activeTab === 'Settings' && <SettingsWorkspace />}
      </main>

      {/* Auth & Tenant Switcher Modal */}
      <AuthModal
        session={session}
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onUpdateSession={handleUpdateSession}
      />
    </div>
  );
}
