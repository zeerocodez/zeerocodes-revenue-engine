import { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
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
  RefreshCw,
  Rocket,
  Shield,
  ShieldCheck,
  Sliders,
  Sparkles,
  TrendingUp,
  UserCheck,
  Zap,
} from 'lucide-react';
import type { UserSession } from '../auth/AuthModal';
import { getDaysRemaining } from '../auth/AuthModal';

interface ClientDashboardProps {
  session: UserSession;
  onNavigate?: (tab: string) => void;
}

export default function ClientDashboard({ session, onNavigate }: ClientDashboardProps) {
  const [roiLeadValue, setRoiLeadValue] = useState<number>(350000);
  const [roiMonthlyLeads, setRoiMonthlyLeads] = useState<number>(200);
  const [recoveryTriggered, setRecoveryTriggered] = useState<boolean>(false);

  // Dynamic ROI calculation
  const qualifiedLeads = Math.round(roiMonthlyLeads * 0.65);
  const estimatedDeals = Math.round(qualifiedLeads * 0.28);
  const projectedRevenue = estimatedDeals * roiLeadValue;
  const softwareCost = 450000;
  const netProfit = projectedRevenue - softwareCost;
  const calculatedRoi = Math.round((netProfit / softwareCost) * 100);

  const daysLeft = getDaysRemaining(session.subscriptionExpiresAt);

  const handleTriggerRecovery = () => {
    setRecoveryTriggered(true);
    setTimeout(() => {
      alert('⚡ Zeerocodes Revenue Recovery Engine initiated! AI recovery cadences dispatched across WhatsApp, SMS & Email for 37 stalled leads.');
      setRecoveryTriggered(false);
    }, 600);
  };

  return (
    <div className="dashboard-canvas">
      {/* Operating Model Division Banner */}
      <div
        style={{
          background: 'var(--ink)',
          color: '#fff',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: '1px solid var(--dark-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              background: 'rgba(199, 255, 85, 0.15)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--accent)',
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '15px', fontWeight: 800 }}>Revenue Command Center: {session.tenantName}</span>
              <span className="role-badge superadmin" style={{ fontSize: '11px', background: 'var(--accent)', color: 'var(--ink)' }}>
                OPERATING MODE: REVENUE ENGINE
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: daysLeft > 0 ? 'rgba(74, 222, 128, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: daysLeft > 0 ? '#4ade80' : '#f87171',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Calendar size={11} /> {daysLeft > 0 ? `30-Day Pass: ${daysLeft} Days Left` : 'Subscription Expired'}
              </span>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--dark-muted)', margin: '2px 0 0 0' }}>
              <strong>Client Role:</strong> Owns lead sources & closes qualified appointments. <strong>Zeerocodes Role:</strong> Operates 45s response, qualification & recovery.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn-secondary"
            onClick={() => onNavigate?.('Billing')}
            style={{ background: 'var(--dark-surface)', color: 'var(--accent)', borderColor: 'var(--dark-border)', padding: '6px 12px', fontSize: '12px' }}
          >
            <Calendar size={13} /> {session.subscriptionPlan}
          </button>
          <button
            className="btn-accent"
            onClick={() => onNavigate?.('Pipeline')}
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            Sales Pipeline <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h1>
            Client Revenue Command Center
            <span style={{ fontSize: '13px', background: 'var(--accent-bg)', color: 'var(--accent-deep)', padding: '3px 10px', borderRadius: '999px', fontWeight: 700 }}>
              Live Ingestion Active
            </span>
          </h1>
          <p>
            Answering the 5 critical commercial questions in real-time, with automated leakage prevention.
          </p>
        </div>

        <div className="view-actions">
          <button className="btn-secondary" onClick={() => alert('Exporting monthly audit & revenue report (PDF/CSV)...')}>
            <Download size={15} /> Export Revenue Report
          </button>
          <button className="btn-accent" onClick={() => onNavigate?.('Inbox')}>
            <MessageSquare size={15} /> Live Conversations
          </button>
        </div>
      </div>

      {/* 5 Canonical Metrics + Revenue Leakage Alert Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '20px' }}>
        {/* 1. Leads Came In */}
        <div className="kpi-card" style={{ padding: '16px' }}>
          <div className="kpi-header">
            <span className="kpi-label" style={{ fontSize: '11.5px' }}>1. Inbound Leads</span>
            <div className="kpi-icon-wrap" style={{ width: '32px', height: '32px' }}>
              <Globe size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: '26px' }}>247</div>
          <div className="kpi-footer" style={{ fontSize: '11px' }}>
            <span className="kpi-delta up">+18%</span>
            <span>Meta & Web forms</span>
          </div>
        </div>

        {/* 2. Contacted */}
        <div className="kpi-card" style={{ padding: '16px' }}>
          <div className="kpi-header">
            <span className="kpi-label" style={{ fontSize: '11.5px' }}>2. Contacted (&lt;45s)</span>
            <div className="kpi-icon-wrap" style={{ width: '32px', height: '32px', background: '#dcfce7', color: '#15803d' }}>
              <Zap size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: '26px' }}>238</div>
          <div className="kpi-footer" style={{ fontSize: '11px' }}>
            <span style={{ color: '#15803d', fontWeight: 700 }}>96.4% Contact Rate</span>
          </div>
        </div>

        {/* 3. Qualified */}
        <div className="kpi-card" style={{ padding: '16px' }}>
          <div className="kpi-header">
            <span className="kpi-label" style={{ fontSize: '11.5px' }}>3. Sales Qualified</span>
            <div className="kpi-icon-wrap" style={{ width: '32px', height: '32px', background: '#e0f2fe', color: '#0369a1' }}>
              <UserCheck size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: '26px' }}>81</div>
          <div className="kpi-footer" style={{ fontSize: '11px' }}>
            <span>Score &gt; 75/100 threshold</span>
          </div>
        </div>

        {/* 4. Appointments */}
        <div className="kpi-card" style={{ padding: '16px' }}>
          <div className="kpi-header">
            <span className="kpi-label" style={{ fontSize: '11.5px' }}>4. Booked Demos</span>
            <div className="kpi-icon-wrap" style={{ width: '32px', height: '32px', background: '#fef3c7', color: '#b45309' }}>
              <Calendar size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: '26px' }}>34</div>
          <div className="kpi-footer" style={{ fontSize: '11px' }}>
            <span style={{ color: '#b45309', fontWeight: 700 }}>91.2% Show-up</span>
          </div>
        </div>

        {/* 5. Closed Won Revenue */}
        <div className="kpi-card dark-theme" style={{ padding: '16px' }}>
          <div className="kpi-header">
            <span className="kpi-label" style={{ fontSize: '11.5px', color: 'var(--accent)' }}>5. Closed Revenue</span>
            <div className="kpi-icon-wrap" style={{ width: '32px', height: '32px' }}>
              <Sparkles size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: '24px', color: 'var(--accent)' }}>₦18.4M</div>
          <div className="kpi-footer" style={{ fontSize: '11px' }}>
            <span style={{ color: '#fff', fontWeight: 700 }}>100% Attribution</span>
          </div>
        </div>
      </div>

      {/* Revenue Leakage Radar Card (Section 10 & 34 of Operating Model) */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e130c 0%, #2b1810 100%)',
          border: '1px solid #ff7849',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 18px rgba(255, 120, 73, 0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'rgba(255, 120, 73, 0.2)',
              color: '#ff7849',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <AlertTriangle size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#ffb199' }}>Revenue Leakage Radar</span>
              <span style={{ fontSize: '11px', background: '#ff7849', color: '#fff', padding: '1px 7px', borderRadius: '4px', fontWeight: 800 }}>
                ACTION NEEDED
              </span>
            </div>
            <div style={{ fontSize: '13px', color: '#ffedd5', marginTop: '3px' }}>
              <strong>₦6,200,000 Potential Revenue at Risk</strong> across 37 leads (stalled in discovery or missed demo confirmation).
            </div>
          </div>
        </div>

        <button
          className="btn-accent"
          onClick={handleTriggerRecovery}
          disabled={recoveryTriggered}
          style={{ background: '#ff7849', color: '#fff', border: 'none', padding: '8px 16px', fontSize: '12.5px', fontWeight: 700 }}
        >
          <RefreshCw size={14} className={recoveryTriggered ? 'animate-spin' : ''} />
          {recoveryTriggered ? 'Dispatching Recovery AI...' : 'Trigger Automated Recovery Workflow'}
        </button>
      </div>

      {/* Interactive Grid: Appointments & ROI Simulator */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', marginBottom: '28px' }}>
        {/* Scheduled Appointments & Live Pipeline */}
        <div className="table-card" style={{ margin: 0 }}>
          <div className="table-header-bar">
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Upcoming Confirmed Client Demonstrations</h3>
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '2px 0 0 0' }}>Automatically scheduled by AI qualification orchestrator</p>
            </div>
            <button className="btn-secondary" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={() => onNavigate?.('Leads')}>
              All Leads
            </button>
          </div>

          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { name: 'Engr. Babatunde Jinadu', company: 'Prime Construct Ltd', time: 'Today at 2:30 PM', channel: 'Zoom / Google Meet', budget: '₦2,500,000', rep: 'Folake Adeleke' },
              { name: 'Dr. Amina Bello', company: 'Apex Health Systems', time: 'Tomorrow at 10:00 AM', channel: 'Executive Phone Call', budget: '₦1,800,000', rep: 'Emeka Nwosu' },
              { name: 'Kelechi Okafor', company: 'Swift Logistics Group', time: 'Friday at 4:00 PM', channel: 'In-Person (Victoria Island)', budget: '₦5,000,000', rep: 'Sarah Alabi' },
              { name: 'Ngozi Ezeani', company: 'CloudRetail HQ', time: 'Next Monday at 11:30 AM', channel: 'Zoom Demo', budget: '₦3,200,000', rep: 'Emeka Nwosu' },
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
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{app.company} • Value: <strong style={{ color: 'var(--ink)' }}>{app.budget}</strong></div>
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

        {/* Dynamic ROI Calculator for Client */}
        <div className="dark-panel">
          <div className="dark-panel-header">
            <div className="dark-panel-title">
              <Sliders size={18} color="var(--accent)" />
              Revenue Engine ROI Simulator
            </div>
            <span style={{ fontSize: '11.5px', color: 'var(--accent)', fontWeight: 700 }}>Interactive</span>
          </div>

          <p style={{ fontSize: '12.5px', color: 'var(--dark-muted)', marginBottom: '16px' }}>
            Adjust your monthly lead intake and average deal size to project net return from Zeerocodes Revenue Engine.
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

          {/* ROI Outputs */}
          <div style={{ padding: '14px', background: 'var(--dark-surface)', borderRadius: '10px', border: '1px solid var(--dark-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--dark-muted)' }}>
              <span>Expected Closed Deals:</span>
              <strong style={{ color: '#fff' }}>~{estimatedDeals} Deals / mo</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--dark-muted)' }}>
              <span>Projected Gross Revenue:</span>
              <strong style={{ color: 'var(--accent)' }}>₦{projectedRevenue.toLocaleString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 800, color: '#fff', paddingTop: '6px', borderTop: '1px dashed var(--dark-border)' }}>
              <span>Projected ROI:</span>
              <span style={{ color: 'var(--accent)', fontSize: '16px' }}>{calculatedRoi}% Yield</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
