import { useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  Cpu,
  Download,
  Flame,
  Globe,
  HelpCircle,
  Laptop,
  Layers,
  MessageSquare,
  PieChart,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  UserCheck,
  Zap,
} from 'lucide-react';
import type { UserSession } from '../auth/AuthModal';

export default function RevenueAttributionWorkspace({ session }: { session?: UserSession }) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  return (
    <div className="dashboard-canvas">
      {/* Header matching Screenshot 4 */}
      <div className="view-header" style={{ marginBottom: '20px' }}>
        <div className="view-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="role-badge superadmin" style={{ background: '#ff5722', color: '#fff' }}>04 ANALYTICS</span>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Tenant: <strong>{session?.tenantName || 'Zeerocodes Enterprise'}</strong></span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
            REPORTING <span style={{ color: '#ff5722' }}>OVERVIEW</span>
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0, fontWeight: 700 }}>
            TELEMETRY & CONVERSION AUDIT: Comprehensive pipeline performance and model confidence.
          </p>
        </div>

        <div className="view-actions" style={{ display: 'flex', gap: '10px' }}>
          <div className="nav-tabs" style={{ background: 'var(--white)' }}>
            {(['7d', '30d', '90d', 'all'] as const).map((r) => (
              <button
                key={r}
                className={`nav-tab-btn ${timeRange === r ? 'active' : ''}`}
                onClick={() => setTimeRange(r)}
                style={{ padding: '5px 10px', fontSize: '12px', textTransform: 'uppercase' }}
              >
                {r === 'all' ? 'All Time' : `Last ${r}`}
              </button>
            ))}
          </div>
          <button className="btn-secondary" onClick={() => alert('Exporting full analytics report (CSV/PDF)...')} style={{ padding: '7px 12px', fontSize: '12px', fontWeight: 700 }}>
            <Download size={14} /> Export Audit
          </button>
        </div>
      </div>

      {/* 4 Metric Cards (Matching Screenshot 4) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {/* Card 1: LEAD VOLUME */}
        <div className="kpi-card" style={{ padding: '20px' }}>
          <div className="kpi-header">
            <span className="kpi-label" style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              LEAD VOLUME
            </span>
            <span className="kpi-delta up" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '2px' }}>
              <ArrowUpRight size={13} /> 10.5%
            </span>
          </div>
          <div className="kpi-value" style={{ fontSize: '36px', fontWeight: 900, margin: '8px 0 4px 0' }}>20</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Total Database</div>
        </div>

        {/* Card 2: CONVERSION */}
        <div className="kpi-card" style={{ padding: '20px' }}>
          <div className="kpi-header">
            <span className="kpi-label" style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              CONVERSION
            </span>
            <span className="kpi-delta down" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '2px' }}>
              <ArrowDownRight size={13} /> 2.1%
            </span>
          </div>
          <div className="kpi-value" style={{ fontSize: '36px', fontWeight: 900, margin: '8px 0 4px 0' }}>0%</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>AI Target (70%+)</div>
        </div>

        {/* Card 3: ACTIVE PIPELINE */}
        <div className="kpi-card" style={{ padding: '20px' }}>
          <div className="kpi-header">
            <span className="kpi-label" style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              ACTIVE PIPELINE
            </span>
            <span className="kpi-delta down" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '2px' }}>
              <ArrowDownRight size={13} /> 0%
            </span>
          </div>
          <div className="kpi-value" style={{ fontSize: '36px', fontWeight: 900, margin: '8px 0 4px 0' }}>20</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>In Progress</div>
        </div>

        {/* Card 4: AGENT ACCURACY */}
        <div className="kpi-card" style={{ padding: '20px' }}>
          <div className="kpi-header">
            <span className="kpi-label" style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              AGENT ACCURACY
            </span>
            <span className="kpi-delta up" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '2px' }}>
              <ArrowUpRight size={13} /> 0.5%
            </span>
          </div>
          <div className="kpi-value" style={{ fontSize: '36px', fontWeight: 900, margin: '8px 0 4px 0', color: '#16a34a' }}>98%</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Model Confidence</div>
        </div>
      </div>

      {/* 2-Column Visual Charts (Matching Screenshot 4) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', marginBottom: '28px' }}>
        {/* Left: QUALIFICATION PIPELINE Line Trend Chart */}
        <div className="table-card" style={{ padding: '22px', margin: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 900, margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              QUALIFICATION <span style={{ color: '#ff5722' }}>PIPELINE</span>
            </h3>
            <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600 }}>Weekly Velocity</span>
          </div>

          {/* SVG Trend Graph */}
          <div style={{ height: '220px', width: '100%', position: 'relative', marginTop: 'auto' }}>
            <svg style={{ width: '100%', height: '100%', overflow: 'visible' }} viewBox="0 0 500 200">
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="40" x2="500" y2="40" stroke="var(--line)" strokeDasharray="4" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="var(--line)" strokeDasharray="4" />
              <line x1="0" y1="160" x2="500" y2="160" stroke="var(--line)" strokeDasharray="4" />

              {/* Area */}
              <polygon points="0,170 100,150 200,120 300,90 400,60 500,30 500,200 0,200" fill="url(#lineGrad)" />

              {/* Line */}
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="0,170 100,150 200,120 300,90 400,60 500,30"
              />

              {/* Active Point */}
              <circle cx="500" cy="30" r="6" fill="#ff5722" stroke="#fff" strokeWidth="2" />
            </svg>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted)', fontWeight: 700, marginTop: '12px' }}>
            <span>WEEK 1</span>
            <span>WEEK 2</span>
            <span>WEEK 3</span>
            <span>WEEK 4</span>
            <span style={{ color: '#ff5722' }}>CURRENT</span>
          </div>
        </div>

        {/* Right: LEAD INDUSTRY Distribution Donut */}
        <div className="table-card" style={{ padding: '22px', margin: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 900, margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              LEAD <span style={{ color: '#ff5722' }}>INDUSTRY</span>
            </h3>
            <span style={{ fontSize: '11.5px', color: 'var(--muted)', fontWeight: 600 }}>Breakdown</span>
          </div>

          {/* Donut Chart Representation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0' }}>
            <div
              style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                background: 'conic-gradient(#3b82f6 0% 45%, #ff5722 45% 75%, #10b981 75% 90%, #8b5cf6 90% 100%)',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
              }}
            >
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'var(--white)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '13px',
                  fontWeight: 800,
                }}
              >
                20 Leads
              </div>
            </div>
          </div>

          {/* Legend Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#3b82f6' }} /> Real Estate & Construction
              </span>
              <strong>45%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#ff5722' }} /> Commercial & Facility Cleaning
              </span>
              <strong>30%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#10b981' }} /> Healthcare & Clinics
              </span>
              <strong>15%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#8b5cf6' }} /> SaaS & Tech
              </span>
              <strong>10%</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
