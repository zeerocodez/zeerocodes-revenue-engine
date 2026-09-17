import { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Download,
  ExternalLink,
  Flame,
  HelpCircle,
  Layers,
  MessageSquare,
  PhoneCall,
  RefreshCw,
  Rocket,
  Shield,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import type { UserSession } from '../auth/AuthModal';
import { SUBSCRIPTION_PLANS, SubscriptionPlanId, TenantUsageSummary, calculateUsagePercentage } from '../../domain/subscription-billing';

export default function BillingWorkspace({ session }: { session?: UserSession }) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId>('growth');
  const [billingCurrency, setBillingCurrency] = useState<'NGN' | 'USD'>('NGN');

  const usage: TenantUsageSummary = {
    organizationId: session?.tenantId || 'zeerocodes-hq',
    currentPlan: 'growth',
    billingCycleStart: '01 Sept 2026',
    billingCycleEnd: '01 Oct 2026',
    leadsIngestedCount: 247,
    leadsIngestedLimit: 1500,
    voiceMinutesUsed: 42,
    voiceMinutesLimit: 200,
    whatsappMessagesSent: 892,
    closedWonAttributedRevenue: 18400000,
    commissionPayableNgn: 460000,
  };

  const leadsPercent = calculateUsagePercentage(usage.leadsIngestedCount, usage.leadsIngestedLimit);
  const voicePercent = calculateUsagePercentage(usage.voiceMinutesUsed, usage.voiceMinutesLimit);

  const handleUpgrade = (planId: SubscriptionPlanId) => {
    setSelectedPlan(planId);
    alert(`⚡ Redirecting to Paystack / Stripe Secure Checkout for ${SUBSCRIPTION_PLANS[planId].name}...`);
  };

  return (
    <div className="dashboard-canvas">
      {/* Header */}
      <div className="view-header" style={{ marginBottom: '20px' }}>
        <div className="view-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="role-badge superadmin" style={{ background: '#ff5722', color: '#fff' }}>06 BILLING & USAGE</span>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Organization: <strong>{session?.tenantName || 'Zeerocodes HQ'}</strong></span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
            BILLING & <span style={{ color: '#ff5722' }}>SUPPORT OVERVIEW</span>
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0, fontWeight: 700 }}>
            METERED ENGINE TELEMETRY: Subscription plan, metered AI credits, and performance ROI commission.
          </p>
        </div>

        <div className="view-actions" style={{ display: 'flex', gap: '10px' }}>
          <div className="nav-tabs" style={{ background: 'var(--white)' }}>
            <button
              className={`nav-tab-btn ${billingCurrency === 'NGN' ? 'active' : ''}`}
              onClick={() => setBillingCurrency('NGN')}
              style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 700 }}
            >
              NGN (₦)
            </button>
            <button
              className={`nav-tab-btn ${billingCurrency === 'USD' ? 'active' : ''}`}
              onClick={() => setBillingCurrency('USD')}
              style={{ padding: '5px 12px', fontSize: '12px', fontWeight: 700 }}
            >
              USD ($)
            </button>
          </div>
          <button className="btn-secondary" onClick={() => alert('Downloading tax invoice (PDF)...')} style={{ padding: '7px 12px', fontSize: '12px', fontWeight: 700 }}>
            <Download size={14} /> Tax Invoices
          </button>
        </div>
      </div>

      {/* Metered Resource Usage Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {/* Metric 1: Ingested Leads */}
        <div className="kpi-card" style={{ padding: '18px' }}>
          <div className="kpi-header">
            <span className="kpi-label" style={{ fontSize: '11.5px', fontWeight: 800 }}>LEADS INGESTED</span>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--accent-deep)' }}>{leadsPercent}%</span>
          </div>
          <div className="kpi-value" style={{ fontSize: '28px', margin: '6px 0' }}>
            {usage.leadsIngestedCount} <span style={{ fontSize: '14px', color: 'var(--muted)' }}>/ {usage.leadsIngestedLimit}</span>
          </div>
          <div style={{ width: '100%', height: '5px', background: 'var(--line)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${leadsPercent}%`, height: '100%', background: '#ff5722' }} />
          </div>
        </div>

        {/* Metric 2: Voice AI Minutes */}
        <div className="kpi-card" style={{ padding: '18px' }}>
          <div className="kpi-header">
            <span className="kpi-label" style={{ fontSize: '11.5px', fontWeight: 800 }}>VOICE AI MINUTES</span>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0369a1' }}>{voicePercent}%</span>
          </div>
          <div className="kpi-value" style={{ fontSize: '28px', margin: '6px 0' }}>
            {usage.voiceMinutesUsed} <span style={{ fontSize: '14px', color: 'var(--muted)' }}>/ {usage.voiceMinutesLimit} min</span>
          </div>
          <div style={{ width: '100%', height: '5px', background: 'var(--line)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${voicePercent}%`, height: '100%', background: '#0284c7' }} />
          </div>
        </div>

        {/* Metric 3: WhatsApp Credits */}
        <div className="kpi-card" style={{ padding: '18px' }}>
          <div className="kpi-header">
            <span className="kpi-label" style={{ fontSize: '11.5px', fontWeight: 800 }}>WHATSAPP SENDS</span>
            <span className="status-pill active" style={{ fontSize: '10px' }}>Active</span>
          </div>
          <div className="kpi-value" style={{ fontSize: '28px', margin: '6px 0' }}>
            {usage.whatsappMessagesSent}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Instant Speed-to-Lead Triage</div>
        </div>

        {/* Metric 4: Closed-Won Attribution & Commission */}
        <div className="kpi-card dark-theme" style={{ padding: '18px' }}>
          <div className="kpi-header">
            <span className="kpi-label" style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--accent)' }}>ATTRIBUTED WON</span>
            <Sparkles size={16} color="var(--accent)" />
          </div>
          <div className="kpi-value" style={{ fontSize: '26px', color: 'var(--accent)', margin: '6px 0' }}>
            ₦18.4M
          </div>
          <div style={{ fontSize: '11px', color: '#fff' }}>
            2.5% Success Comm: <strong style={{ color: 'var(--accent)' }}>₦460,000</strong>
          </div>
        </div>
      </div>

      {/* Subscription Pricing Matrix */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
          Subscription Tiers & Engine Capacity
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
          {(['starter', 'growth', 'enterprise'] as const).map((planKey) => {
            const plan = SUBSCRIPTION_PLANS[planKey];
            const isCurrent = planKey === selectedPlan;
            return (
              <div
                key={planKey}
                className="table-card"
                style={{
                  padding: '24px',
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  border: isCurrent ? '2px solid #ff5722' : '1px solid var(--line)',
                  position: 'relative',
                  boxShadow: isCurrent ? '0 8px 24px rgba(255, 87, 34, 0.15)' : 'var(--shadow-sm)',
                }}
              >
                {isCurrent && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-11px',
                      right: '20px',
                      background: '#ff5722',
                      color: '#fff',
                      fontSize: '10.5px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    CURRENT PLAN
                  </span>
                )}

                <h3 style={{ fontSize: '18px', fontWeight: 900, margin: '0 0 6px 0' }}>{plan.name}</h3>
                <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--ink)', margin: '8px 0 16px 0' }}>
                  {billingCurrency === 'NGN' ? `₦${plan.monthlyFeeNgn.toLocaleString()}` : `$${plan.monthlyFeeUsd}`}
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted)' }}> / month</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, marginBottom: '20px' }}>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--ink)' }}>
                      <CheckCircle2 size={15} color="#16a34a" style={{ flexShrink: 0 }} />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <button
                  className={isCurrent ? 'btn-secondary' : 'btn-accent'}
                  onClick={() => handleUpgrade(planKey)}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '10px',
                    fontSize: '13px',
                    fontWeight: 800,
                    background: isCurrent ? 'var(--paper)' : '#ff5722',
                    color: isCurrent ? 'var(--ink)' : '#fff',
                    border: 'none',
                  }}
                >
                  {isCurrent ? 'Active Subscription' : 'Upgrade to ' + plan.name}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
