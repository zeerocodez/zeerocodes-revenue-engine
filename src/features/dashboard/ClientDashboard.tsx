import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Download,
  Flame,
  Globe,
  HelpCircle,
  MessageSquare,
  PhoneCall,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Rocket,
  Shield,
  ShieldCheck,
  Sliders,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';
import type { UserSession } from '../auth/AuthModal';
import { getDaysRemaining } from '../auth/AuthModal';
import SmartWalkthroughModal from '../onboarding/SmartWalkthroughModal';

interface ClientDashboardProps {
  session: UserSession;
  onNavigate?: (tab: string) => void;
}

export default function ClientDashboard({ session, onNavigate }: ClientDashboardProps) {
  const [roiLeadValue, setRoiLeadValue] = useState<number>(350000);
  const [roiMonthlyLeads, setRoiMonthlyLeads] = useState<number>(200);
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState<boolean>(() => {
    // Automatically open walkthrough on first visit or if flagged by signup
    const shouldShow = localStorage.getItem('zeero_show_onboarding_tour');
    if (shouldShow === 'true') {
      localStorage.removeItem('zeero_show_onboarding_tour');
      return true;
    }
    return false;
  });

  const daysLeft = getDaysRemaining(session.subscriptionExpiresAt);

  // Dynamic ROI calculation
  const qualifiedLeads = Math.round(roiMonthlyLeads * 0.65);
  const estimatedDeals = Math.round(qualifiedLeads * 0.28);
  const projectedRevenue = estimatedDeals * roiLeadValue;
  const softwareCost = 450000;
  const netProfit = projectedRevenue - softwareCost;
  const calculatedRoi = Math.round((netProfit / softwareCost) * 100);

  return (
    <div className="dashboard-canvas">
      {/* Smart Walkthrough Modal */}
      <SmartWalkthroughModal
        isOpen={isWalkthroughOpen}
        onClose={() => setIsWalkthroughOpen(false)}
        session={session}
        onNavigate={(tab) => onNavigate?.(tab)}
      />

      {/* Top Welcome & Operating Model Bar */}
      <div
        style={{
          background: 'var(--ink)',
          color: '#fff',
          borderRadius: '12px',
          padding: '18px 24px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          border: '1px solid var(--dark-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(199, 255, 85, 0.15)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--accent)',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '16px', fontWeight: 800 }}>
                {session.tenantName} — Revenue Command Center
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'rgba(74, 222, 128, 0.15)',
                  color: '#4ade80',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                🟢 7-Day Free Trial: {daysLeft} Days Remaining
              </span>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--dark-muted)', margin: '3px 0 0 0' }}>
              Welcome back, <strong>{session.userName}</strong>. Your autonomous speed-to-lead engine and qualified booking pipeline are live.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setIsWalkthroughOpen(true)}
            className="btn-accent"
            style={{ padding: '8px 16px', fontSize: '12.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Rocket size={15} /> 🚀 Guided System Walkthrough
          </button>
          <button
            onClick={() => onNavigate?.('Pipeline')}
            className="btn-secondary"
            style={{ background: 'var(--dark-surface)', color: '#fff', borderColor: 'var(--dark-border)', padding: '8px 14px', fontSize: '12.5px' }}
          >
            Deals CRM →
          </button>
        </div>
      </div>

      {/* Simplified "What To Do Next" 3-Step Quick Start Roadmap */}
      <div className="table-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={18} color="var(--accent-deep)" />
            <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
              Quick Start Action Plan (Get Your First 5 Booked Deals)
            </h2>
          </div>
          <button
            onClick={() => setIsWalkthroughOpen(true)}
            style={{ background: 'none', border: 'none', color: 'var(--accent-deep)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
          >
            View Full 5-Step Blueprint ↗
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          {/* Step 1 */}
          <div
            onClick={() => onNavigate?.('Lead Sources')}
            style={{
              padding: '16px',
              borderRadius: '10px',
              background: 'var(--paper)',
              border: '1px solid var(--line)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-deep)', background: 'var(--accent-bg)', padding: '2px 6px', borderRadius: '4px' }}>
                STEP 1: FIRST ACTION
              </span>
              <Radio size={15} color="var(--muted)" />
            </div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--ink)' }}>
              Connect Lead Sources
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
              Pipe your website form, WhatsApp number, or upload a CSV batch.
            </p>
            <div style={{ marginTop: '10px', fontSize: '11.5px', fontWeight: 700, color: 'var(--accent-deep)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Connect Inbound Channels <ChevronRight size={13} />
            </div>
          </div>

          {/* Step 2 */}
          <div
            onClick={() => onNavigate?.('Onboarding')}
            style={{
              padding: '16px',
              borderRadius: '10px',
              background: 'var(--paper)',
              border: '1px solid var(--line)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', background: '#e0f2fe', padding: '2px 6px', borderRadius: '4px' }}>
                STEP 2: TEAM SETUP
              </span>
              <Calendar size={15} color="var(--muted)" />
            </div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--ink)' }}>
              Add Closer Calendar Links
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
              Add sales reps so the AI books demo calls directly into their Google Meet/Cal.
            </p>
            <div style={{ marginTop: '10px', fontSize: '11.5px', fontWeight: 700, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Configure Sales Closers <ChevronRight size={13} />
            </div>
          </div>

          {/* Step 3 */}
          <div
            onClick={() => onNavigate?.('Qualify Logic')}
            style={{
              padding: '16px',
              borderRadius: '10px',
              background: 'var(--paper)',
              border: '1px solid var(--line)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#16a34a', background: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>
                STEP 3: AUTONOMOUS AI
              </span>
              <Zap size={15} color="var(--muted)" />
            </div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--ink)' }}>
              45-Second AI Qualification
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
              The engine automatically engages leads in &lt;45s and filters high-budget buyers.
            </p>
            <div style={{ marginTop: '10px', fontSize: '11.5px', fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View AI Qualify Rules <ChevronRight size={13} />
            </div>
          </div>
        </div>
      </div>

      {/* 5 Clear, Spacious KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* 1. Inbound Leads */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">1. Inbound Leads</span>
            <div className="kpi-icon-wrap">
              <Globe size={18} />
            </div>
          </div>
          <div className="kpi-value">247</div>
          <div className="kpi-footer">
            <span className="kpi-delta up">+18%</span>
            <span>Meta Ads & Web forms</span>
          </div>
        </div>

        {/* 2. Contacted */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">2. Fast Contact (&lt;45s)</span>
            <div className="kpi-icon-wrap" style={{ background: '#dcfce7', color: '#15803d' }}>
              <Zap size={18} />
            </div>
          </div>
          <div className="kpi-value">238</div>
          <div className="kpi-footer">
            <span style={{ color: '#15803d', fontWeight: 700 }}>96.4% Contact Rate</span>
          </div>
        </div>

        {/* 3. Qualified */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">3. Sales-Qualified</span>
            <div className="kpi-icon-wrap" style={{ background: '#e0f2fe', color: '#0369a1' }}>
              <UserCheck size={18} />
            </div>
          </div>
          <div className="kpi-value">81</div>
          <div className="kpi-footer">
            <span>Score &gt; 75/100 threshold</span>
          </div>
        </div>

        {/* 4. Booked Demos */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">4. Booked Meetings</span>
            <div className="kpi-icon-wrap" style={{ background: '#fef3c7', color: '#b45309' }}>
              <Calendar size={18} />
            </div>
          </div>
          <div className="kpi-value">34</div>
          <div className="kpi-footer">
            <span style={{ color: '#b45309', fontWeight: 700 }}>91.2% Show-Up Rate</span>
          </div>
        </div>

        {/* 5. Closed Won Revenue */}
        <div className="kpi-card dark-theme">
          <div className="kpi-header">
            <span className="kpi-label" style={{ color: 'var(--accent)' }}>5. Closed Revenue</span>
            <div className="kpi-icon-wrap">
              <Sparkles size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent)' }}>₦18.4M</div>
          <div className="kpi-footer">
            <span style={{ color: '#fff', fontWeight: 700 }}>100% Attributed Cash</span>
          </div>
        </div>
      </div>

      {/* 2-Column Section: Confirmed Meetings + ROI Yield Simulator */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', marginBottom: '28px' }}>
        {/* Confirmed Meetings Feed */}
        <div className="table-card" style={{ margin: 0 }}>
          <div className="table-header-bar">
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>Upcoming Confirmed Client Demonstrations</h3>
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '2px 0 0 0' }}>
                Pre-qualified and automatically booked onto sales closer calendars
              </p>
            </div>
            <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => onNavigate?.('Pipeline')}>
              Deals CRM ↗
            </button>
          </div>

          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { name: 'Engr. Babatunde Jinadu', company: 'Prime Construct Ltd', time: 'Today at 2:30 PM', channel: 'Google Meet', budget: '₦2,500,000', rep: 'Folake Adeleke' },
              { name: 'Dr. Amina Bello', company: 'Apex Health Systems', time: 'Tomorrow at 10:00 AM', channel: 'Zoom Demo', budget: '₦1,800,000', rep: 'Emeka Nwosu' },
              { name: 'Kelechi Okafor', company: 'Swift Logistics Group', time: 'Friday at 4:00 PM', channel: 'Executive Video Call', budget: '₦5,000,000', rep: 'Sarah Alabi' },
              { name: 'Ngozi Ezeani', company: 'CloudRetail HQ', time: 'Next Monday at 11:30 AM', channel: 'Google Meet', budget: '₦3,200,000', rep: 'Emeka Nwosu' },
            ].map((app, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: 'var(--paper)',
                  border: '1px solid var(--line)',
                }}
              >
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--ink)' }}>{app.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{app.company} • Deal Value: <strong style={{ color: 'var(--ink)' }}>{app.budget}</strong></div>
                  <div style={{ fontSize: '11px', color: '#2563eb', marginTop: '2px' }}>📅 {app.time} ({app.channel})</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="status-pill booked">Confirmed</span>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>Closer: {app.rep}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Clean, Non-Terrifying ROI Yield Simulator */}
        <div className="dark-panel">
          <div className="dark-panel-header">
            <div className="dark-panel-title">
              <Sliders size={18} color="var(--accent)" />
              Projected Revenue Yield Simulator
            </div>
            <span style={{ fontSize: '11.5px', color: 'var(--accent)', fontWeight: 800 }}>Yield Calculator</span>
          </div>

          <p style={{ fontSize: '12.5px', color: 'var(--dark-muted)', marginBottom: '16px' }}>
            Adjust your monthly lead intake and average deal value to project closed revenue yield.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--dark-text)', marginBottom: '4px' }}>
                <span>Monthly Inbound Leads:</span>
                <strong>{roiMonthlyLeads} Leads</strong>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                step="25"
                value={roiMonthlyLeads}
                onChange={(e) => setRoiMonthlyLeads(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--dark-text)', marginBottom: '4px' }}>
                <span>Average Deal Value (₦):</span>
                <strong>₦{roiLeadValue.toLocaleString()}</strong>
              </div>
              <input
                type="range"
                min="50000"
                max="2000000"
                step="50000"
                value={roiLeadValue}
                onChange={(e) => setRoiLeadValue(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
            </div>
          </div>

          {/* ROI Yield Box */}
          <div style={{ padding: '14px', background: 'var(--dark-surface)', borderRadius: '10px', border: '1px solid var(--dark-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--dark-muted)' }}>
              <span>Expected Closed Deals:</span>
              <strong style={{ color: '#fff' }}>~{estimatedDeals} Deals / month</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--dark-muted)' }}>
              <span>Projected Gross Revenue:</span>
              <strong style={{ color: 'var(--accent)' }}>₦{projectedRevenue.toLocaleString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', fontWeight: 800, color: '#fff', paddingTop: '6px', borderTop: '1px dashed var(--dark-border)' }}>
              <span>Projected ROI:</span>
              <span style={{ color: 'var(--accent)', fontSize: '15px' }}>{calculatedRoi}% Yield</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
