import { Calendar, RefreshCw, ShieldAlert, Sparkles, ArrowRight, Lock, LogOut } from 'lucide-react';
import type { UserSession } from './AuthModal';

interface SubscriptionLockGateProps {
  session: UserSession;
  onRenew: (days?: number) => void;
  onSwitchAccount: () => void;
  onSignOut: () => void;
  onBackToLanding: () => void;
}

export default function SubscriptionLockGate({
  session,
  onRenew,
  onSwitchAccount,
  onSignOut,
  onBackToLanding,
}: SubscriptionLockGateProps) {
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 120px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '30px 20px',
        background: 'radial-gradient(circle at 50% 20%, rgba(239, 68, 68, 0.08) 0%, rgba(10, 15, 12, 0.98) 100%)',
      }}
    >
      <div
        style={{
          maxWidth: '560px',
          width: '100%',
          background: 'var(--dark-card)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '16px',
          padding: '36px 32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 20px auto',
          }}
        >
          <Lock size={32} />
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.12)', color: '#f87171', fontSize: '11.5px', fontWeight: 800, marginBottom: '12px' }}>
          <ShieldAlert size={14} /> 7-DAY FREE TRIAL ENDED
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: '0 0 10px 0', letterSpacing: '-0.02em' }}>
          Activate Full Subscription Access
        </h2>

        <p style={{ fontSize: '14px', color: 'var(--dark-text)', lineHeight: 1.55, margin: '0 0 20px 0' }}>
          The 7-day free trial period for <strong>{session.tenantName}</strong> has completed. Real-time qualification, 45s speed to lead, and setter handoffs are currently paused.
        </p>

        <div
          style={{
            background: 'var(--dark-surface)',
            border: '1px solid var(--dark-border)',
            borderRadius: '10px',
            padding: '16px',
            textAlign: 'left',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12.5px' }}>
            <span style={{ color: 'var(--dark-muted)' }}>Business Account:</span>
            <strong style={{ color: '#fff' }}>{session.tenantName}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12.5px' }}>
            <span style={{ color: 'var(--dark-muted)' }}>Authorized User:</span>
            <strong style={{ color: '#fff' }}>{session.userName} ({session.userEmail})</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12.5px' }}>
            <span style={{ color: 'var(--dark-muted)' }}>Plan Tier:</span>
            <strong style={{ color: 'var(--accent)' }}>{session.subscriptionPlan}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
            <span style={{ color: 'var(--dark-muted)' }}>Subscription Term:</span>
            <strong style={{ color: '#4ade80' }}>Monthly Recurring (Cancel Anytime)</strong>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={() => onRenew(30)}
            className="btn-accent"
            style={{
              width: '100%',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <RefreshCw size={16} /> Activate Monthly Subscription Access
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
            <button
              onClick={onSwitchAccount}
              className="btn-secondary"
              style={{ padding: '9px 12px', fontSize: '12px' }}
            >
              Switch Account
            </button>
            <button
              onClick={onBackToLanding}
              className="btn-secondary"
              style={{ padding: '9px 12px', fontSize: '12px' }}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
