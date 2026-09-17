import { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Download,
  Flame,
  Globe,
  MessageSquare,
  PhoneCall,
  Sliders,
  Sparkles,
  TrendingUp,
  UserCheck,
  Zap,
} from 'lucide-react';
import type { UserSession } from '../auth/AuthModal';

interface ClientDashboardProps {
  session: UserSession;
  onNavigate?: (tab: string) => void;
}

export default function ClientDashboard({ session, onNavigate }: ClientDashboardProps) {
  const [roiLeadValue, setRoiLeadValue] = useState<number>(350000);
  const [roiMonthlyLeads, setRoiMonthlyLeads] = useState<number>(200);

  // Dynamic ROI calculation
  const qualifiedLeads = Math.round(roiMonthlyLeads * 0.65);
  const estimatedDeals = Math.round(qualifiedLeads * 0.28);
  const projectedRevenue = estimatedDeals * roiLeadValue;
  const softwareCost = 450000;
  const netProfit = projectedRevenue - softwareCost;
  const calculatedRoi = Math.round((netProfit / softwareCost) * 100);

  return (
    <div className="dashboard-canvas">
      {/* Header */}
      <div className="view-header">
        <div className="view-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="role-badge" style={{ background: '#dbeafe', color: '#1d4ed8' }}>Client Tenant Portal</span>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Organization: <strong>{session.tenantName}</strong></span>
          </div>
          <h1>
            Client Growth & Revenue Portal
            <span style={{ fontSize: '14px', background: 'var(--accent-bg)', color: 'var(--accent-deep)', padding: '3px 10px', borderRadius: '999px', fontWeight: 700 }}>
              Active
            </span>
          </h1>
          <p>Self-service visibility into your inbound sales pipeline, booked customer meetings, conversion rates, and ROI.</p>
        </div>

        <div className="view-actions">
          <button className="btn-secondary" onClick={() => alert('Exporting monthly audit & revenue report (PDF/CSV)...')}>
            <Download size={15} /> Export Audit Report
          </button>
          <button className="btn-accent" onClick={() => onNavigate?.('Pipeline')}>
            View My Deals <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Top Client KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Total Inbound Captured</span>
            <div className="kpi-icon-wrap">
              <Globe size={18} />
            </div>
          </div>
          <div className="kpi-value">342</div>
          <div className="kpi-footer">
            <span className="kpi-delta up">+14.2%</span>
            <span>from Meta, Google & Direct</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Sales-Ready Qualified</span>
            <div className="kpi-icon-wrap" style={{ background: '#dcfce7', color: '#15803d' }}>
              <UserCheck size={18} />
            </div>
          </div>
          <div className="kpi-value">224</div>
          <div className="kpi-footer">
            <span style={{ color: '#15803d', fontWeight: 700 }}>65.5% Qualification Rate</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Confirmed Appointments</span>
            <div className="kpi-icon-wrap" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
              <Calendar size={18} />
            </div>
          </div>
          <div className="kpi-value">86</div>
          <div className="kpi-footer">
            <span>88.2% show-up rate</span>
          </div>
        </div>

        <div className="kpi-card dark-theme">
          <div className="kpi-header">
            <span className="kpi-label">Generated Revenue</span>
            <div className="kpi-icon-wrap">
              <Sparkles size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent)' }}>₦16,200,000</div>
          <div className="kpi-footer">
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>34 Closed Deals</span>
          </div>
        </div>
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
