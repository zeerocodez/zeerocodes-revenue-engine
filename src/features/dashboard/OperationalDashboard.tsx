import { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Flame,
  GitBranch,
  Layers,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import type { UserSession } from '../auth/AuthModal';

interface OperationalDashboardProps {
  session: UserSession;
  onNavigate?: (tab: string) => void;
}

export default function OperationalDashboard({ session, onNavigate }: OperationalDashboardProps) {
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d' | 'quarter'>('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="dashboard-canvas">
      {/* Top Banner / Header */}
      <div className="view-header">
        <div className="view-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="role-badge superadmin">Executive Ops Hub</span>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>• Tenant: <strong>{session.tenantName}</strong></span>
          </div>
          <h1>
            Revenue Operations Command Center
            <span style={{ fontSize: '14px', background: 'rgba(199, 255, 85, 0.2)', color: 'var(--accent-deep)', padding: '3px 10px', borderRadius: '999px', fontWeight: 700 }}>
              Live Telemetry
            </span>
          </h1>
          <p>Real-time cross-channel pipeline analytics, automated qualification velocity, SDR triage, and leakage recovery.</p>
        </div>

        <div className="view-actions">
          <div className="nav-tabs" style={{ background: 'var(--white)' }}>
            {(['today', '7d', '30d', 'quarter'] as const).map((t) => (
              <button
                key={t}
                className={`nav-tab-btn ${timeRange === t ? 'active' : ''}`}
                onClick={() => setTimeRange(t)}
                style={{ padding: '6px 12px', fontSize: '12px', textTransform: 'uppercase' }}
              >
                {t}
              </button>
            ))}
          </div>

          <button className="btn-secondary" onClick={handleRefresh}>
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
            Sync Ops
          </button>

          <button className="btn-accent" onClick={() => onNavigate?.('Pipeline')}>
            <Zap size={16} /> Deals Pipeline
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="kpi-grid">
        <div className="kpi-card dark-theme">
          <div className="kpi-header">
            <span className="kpi-label">Active Pipeline Value</span>
            <div className="kpi-icon-wrap">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent)' }}>₦48,500,000</div>
          <div className="kpi-footer">
            <span className="kpi-delta up"><ArrowUpRight size={14} /> +24.8%</span>
            <span>vs prior period</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Total Inbound Leads</span>
            <div className="kpi-icon-wrap">
              <Users size={18} />
            </div>
          </div>
          <div className="kpi-value">1,428</div>
          <div className="kpi-footer">
            <span className="kpi-delta up"><ArrowUpRight size={14} /> +18.2%</span>
            <span>across 5 channels</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">AI Qualification Rate</span>
            <div className="kpi-icon-wrap">
              <Bot size={18} />
            </div>
          </div>
          <div className="kpi-value">64.2%</div>
          <div className="kpi-footer">
            <span className="kpi-delta up"><ArrowUpRight size={14} /> +5.4%</span>
            <span>avg score: 78/100</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Revenue Leakage Saved</span>
            <div className="kpi-icon-wrap" style={{ background: '#fef3c7', color: '#b45309' }}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="kpi-value">₦12,400,000</div>
          <div className="kpi-footer">
            <span style={{ color: '#16a34a', fontWeight: 700 }}>42 deals recovered</span>
          </div>
        </div>
      </div>

      {/* Main Operational Split Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '28px' }}>
        {/* Left Column: Live Pipeline Velocity & Channels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="table-card" style={{ padding: '24px', margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--ink)' }}>
                  Conversion Velocity & Funnel Telemetry
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
                  Time elapsed from intake ➔ AI Qualification ➔ SDR Call ➔ Closed Won
                </p>
              </div>
              <span className="status-pill won">
                <Flame size={13} /> 94.2% Health Index
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
              <div style={{ background: 'var(--paper)', padding: '14px', borderRadius: '10px', border: '1px solid var(--line)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Avg Speed-to-Lead</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', marginTop: '4px' }}>42 sec</div>
                <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '2px' }}>⚡ 4x faster than SLA</div>
              </div>
              <div style={{ background: 'var(--paper)', padding: '14px', borderRadius: '10px', border: '1px solid var(--line)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Demo Show Rate</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', marginTop: '4px' }}>82.5%</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>148 booked meetings</div>
              </div>
              <div style={{ background: 'var(--paper)', padding: '14px', borderRadius: '10px', border: '1px solid var(--line)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Win Rate (Post-Demo)</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', marginTop: '4px' }}>38.4%</div>
                <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '2px' }}>+4.1% MoM</div>
              </div>
              <div style={{ background: 'var(--paper)', padding: '14px', borderRadius: '10px', border: '1px solid var(--line)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>CAC Payback</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', marginTop: '4px' }}>21 Days</div>
                <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '2px' }}>Top decile SaaS</div>
              </div>
            </div>

            {/* Visual Stage Progress Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                  <span>1. Inbound Capture & Verification</span>
                  <span style={{ color: 'var(--ink)' }}>1,428 leads (100%)</span>
                </div>
                <div style={{ height: '8px', background: 'var(--line)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '100%', background: 'var(--ink)', borderRadius: '4px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                  <span>2. AI Automated Qualification Passed</span>
                  <span style={{ color: 'var(--ink)' }}>917 leads (64.2%)</span>
                </div>
                <div style={{ height: '8px', background: 'var(--line)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '64.2%', background: '#7c3aed', borderRadius: '4px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                  <span>3. SDR Triage & Demo Booked</span>
                  <span style={{ color: 'var(--ink)' }}>312 deals (21.8%)</span>
                </div>
                <div style={{ height: '8px', background: 'var(--line)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '21.8%', background: '#2563eb', borderRadius: '4px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                  <span>4. Closed Won Revenue</span>
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>120 deals (8.4% of total inbound)</span>
                </div>
                <div style={{ height: '8px', background: 'var(--line)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '8.4%', background: '#16a34a', borderRadius: '4px' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Channel ROI Breakdown Table */}
          <div className="table-card" style={{ margin: 0 }}>
            <div className="table-header-bar">
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Acquisition Channel Yield & Attribution</h3>
              <button className="btn-secondary" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={() => onNavigate?.('Lead Sources')}>
                Manage Sources
              </button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Channel / Source</th>
                  <th>Leads</th>
                  <th>Qualified %</th>
                  <th>Booked Meetings</th>
                  <th>Closed Won (NGN)</th>
                  <th>ROI Yield</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Meta Ads (LeadGen High Intent)</strong></td>
                  <td>612</td>
                  <td><span className="status-pill qualified">68.4%</span></td>
                  <td>142</td>
                  <td><strong>₦22,400,000</strong></td>
                  <td><span style={{ color: '#16a34a', fontWeight: 700 }}>4.8x</span></td>
                </tr>
                <tr>
                  <td><strong>Google Search (High Urgency)</strong></td>
                  <td>390</td>
                  <td><span className="status-pill qualified">74.1%</span></td>
                  <td>98</td>
                  <td><strong>₦16,800,000</strong></td>
                  <td><span style={{ color: '#16a34a', fontWeight: 700 }}>6.2x</span></td>
                </tr>
                <tr>
                  <td><strong>WhatsApp Direct & Referral</strong></td>
                  <td>284</td>
                  <td><span className="status-pill qualified">58.0%</span></td>
                  <td>52</td>
                  <td><strong>₦7,100,000</strong></td>
                  <td><span style={{ color: '#16a34a', fontWeight: 700 }}>8.4x</span></td>
                </tr>
                <tr>
                  <td><strong>Cold Outbound Sequence</strong></td>
                  <td>142</td>
                  <td><span className="status-pill contacting">42.2%</span></td>
                  <td>20</td>
                  <td><strong>₦2,200,000</strong></td>
                  <td><span style={{ color: '#16a34a', fontWeight: 700 }}>2.1x</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: SDR Leaderboard & Revenue Leakage Watcher */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Revenue Leakage Watcher Panel */}
          <div className="dark-panel">
            <div className="dark-panel-header">
              <div className="dark-panel-title">
                <span className="glow-dot" />
                Revenue Leakage Radar
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--accent)', fontWeight: 700 }}>Active Auto-Recovery</span>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--dark-muted)', marginBottom: '16px' }}>
              Autonomous monitors detecting ghosted deals, slow SDR responses, and unbooked high-value leads.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ padding: '12px', background: 'var(--dark-surface)', borderRadius: '8px', border: '1px solid var(--dark-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>Post-Demo Follow-up Stall</span>
                  <span style={{ fontSize: '11px', color: '#ffbf72', fontWeight: 700 }}>5 Deals</span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--dark-muted)' }}>
                  Estimated leakage: <strong>₦3,250,000</strong> • Recovery sequence running via WhatsApp
                </div>
              </div>

              <div style={{ padding: '12px', background: 'var(--dark-surface)', borderRadius: '8px', border: '1px solid var(--dark-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>SDR SLA Expiry Prevention</span>
                  <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700 }}>0 Breached</span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--dark-muted)' }}>
                  All high-urgency items claimed in under 3 minutes
                </div>
              </div>
            </div>

            <button
              className="btn-accent"
              style={{ width: '100%', marginTop: '16px', justifyContent: 'center' }}
              onClick={() => onNavigate?.('Revenue')}
            >
              View Full Attribution & Recovery <ArrowUpRight size={15} />
            </button>
          </div>

          {/* SDR Speed-to-Lead Leaderboard */}
          <div className="table-card" style={{ padding: '20px', margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={16} /> SDR Team Leaderboard
              </h3>
              <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>This Month</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { name: 'Emeka Nwosu', claimed: 148, converted: 42, avgSpeed: '28s', winRate: '28.3%', badge: '🥇 Top Performer' },
                { name: 'Folake Adeleke', claimed: 124, converted: 36, avgSpeed: '35s', winRate: '29.0%', badge: '🥈 High Closer' },
                { name: 'Chidi Eze', claimed: 96, converted: 24, avgSpeed: '52s', winRate: '25.0%', badge: '🥉 Consistent' },
              ].map((rep, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'var(--paper)',
                    border: '1px solid var(--line)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--ink)', color: 'var(--accent)', display: 'grid', placeItems: 'center', fontSize: '12px', fontWeight: 800 }}>
                      {rep.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>{rep.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{rep.badge} • Avg: {rep.avgSpeed}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#16a34a' }}>{rep.converted} deals</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--muted)' }}>{rep.winRate} win rate</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="btn-secondary"
              style={{ width: '100%', marginTop: '16px', justifyContent: 'center', fontSize: '12.5px' }}
              onClick={() => onNavigate?.('SDR Queue')}
            >
              Open Live SDR Workstation <GitBranch size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
