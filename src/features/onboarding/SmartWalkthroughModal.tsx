import { useState } from 'react';
import {
  ArrowRight,
  Bot,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Database,
  Flame,
  Globe,
  HelpCircle,
  MessageSquare,
  Play,
  Radio,
  RefreshCw,
  Rocket,
  Shield,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  UserCheck,
  Users,
  X,
  Zap,
} from 'lucide-react';
import type { UserSession } from '../auth/AuthModal';

interface SmartWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: UserSession;
  onNavigate: (tab: string) => void;
}

export default function SmartWalkthroughModal({
  isOpen,
  onClose,
  session,
  onNavigate,
}: SmartWalkthroughModalProps) {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([1]);

  if (!isOpen) return null;

  const markStepDone = (stepNum: number) => {
    if (!completedSteps.includes(stepNum)) {
      setCompletedSteps([...completedSteps, stepNum]);
    }
  };

  const stepsData = [
    {
      step: 1,
      title: '1. Connect Inbound Lead Sources',
      subtitle: 'Where leads enter your engine',
      badge: 'FIRST STEP',
      icon: Radio,
      color: '#10b981',
      whatToDo: 'Pipe your website contact forms, WhatsApp business number, Meta Lead Ads, or simply upload a batch CSV of prospect contacts.',
      whatHappens: 'Zeerocodes automatically ingests each lead into an isolated multi-tenant silo, verifies consent, and assigns an instant tracking ID.',
      targetTab: 'Lead Sources',
      actionText: 'Connect Lead Sources',
      expectedResult: '100% Inbound Lead Capture & Ingestion (Zero Lost Inquiries)',
    },
    {
      step: 2,
      title: '2. 45-Second AI Speed to Lead',
      subtitle: 'Instant response & qualification',
      badge: 'AI BRAIN',
      icon: Zap,
      color: '#c7ff55',
      whatToDo: 'Set your qualification criteria: minimum deal budget, location requirement, and decision-maker status.',
      whatHappens: 'When an inquiry arrives, the AI engages within 45 seconds via WhatsApp/SMS, answers questions using your business knowledge, and scores intent (0-100).',
      targetTab: 'Qualify Logic',
      actionText: 'Review Qualification Rules',
      expectedResult: '96.4% Fast Contact Rate & High-Intent Scoring in under 45s',
    },
    {
      step: 3,
      title: '3. Team Closers & Calendar Booking',
      subtitle: 'Automatic demo scheduling',
      badge: 'SALES TEAM',
      icon: Calendar,
      color: '#38bdf8',
      whatToDo: 'Add your sales team (closers & setters) with their Google Meet, Cal.com, or Calendly calendar booking links.',
      whatHappens: 'Once a lead qualifies (score > 75), the engine automatically proposes available time slots and syncs the confirmed demo directly to your closer’s calendar.',
      targetTab: 'Onboarding',
      actionText: 'Set Up Team Closers',
      expectedResult: '3-5x More Confirmed Sales Meetings on Closer Calendars',
    },
    {
      step: 4,
      title: '4. Lead Leakage & Recovery Radar',
      subtitle: 'Never let a deal slip away',
      badge: 'RADAR GUARD',
      icon: RefreshCw,
      color: '#fb923c',
      whatToDo: 'Review autonomous follow-up cadences that re-engage stalled or unresponsive prospects.',
      whatHappens: 'If a customer pauses or misses a demo, smart automated revival sequences trigger over 1h, 4h, and 24h intervals to revive the deal without manual SDR labor.',
      targetTab: 'Follow-ups',
      actionText: 'View Recovery Cadences',
      expectedResult: '₦6.2M+ Average Rescued Pipeline Revenue per month',
    },
    {
      step: 5,
      title: '5. Closed-Won Cash & ROI Attribution',
      subtitle: 'Clear commercial outcome',
      badge: 'END RESULT',
      icon: Sparkles,
      color: '#c084fc',
      whatToDo: 'Move deals along the Booked Deals CRM pipeline as your closers win contracts.',
      whatHappens: 'The engine attributes every won deal back to the original source, calculating your exact marketing ROI, cost-per-acquisition, and setter performance.',
      targetTab: 'Pipeline',
      actionText: 'Open Booked Deals CRM',
      expectedResult: 'Transparent Revenue Yield, 100% Attribution, and Scalable Cashflow',
    },
  ];

  const currentStepData = stepsData[activeStep - 1];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content dark-modal"
        style={{
          maxWidth: '740px',
          maxHeight: 'calc(100vh - 40px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 30px 80px -15px rgba(0,0,0,0.85), 0 0 0 1px rgba(199, 255, 85, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '16px 24px', borderBottom: '1px solid var(--dark-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'var(--accent)',
                color: 'var(--ink)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Rocket size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#fff' }}>
                  Smart Quick Start & System Walkthrough
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(74, 222, 128, 0.15)',
                    color: '#4ade80',
                  }}
                >
                  🟢 7-Day Free Trial
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: 'var(--dark-muted)' }}>
                Master the 5 steps: What to do first, what to do next, and how you get 3-5x booked revenue.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--dark-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 5-Step Visual Stepper Bar */}
        <div
          style={{
            display: 'flex',
            background: 'var(--dark-surface)',
            borderBottom: '1px solid var(--dark-border)',
            padding: '10px 20px',
            gap: '8px',
            overflowX: 'auto',
          }}
        >
          {stepsData.map((s) => {
            const isActive = activeStep === s.step;
            const isDone = completedSteps.includes(s.step);
            const Icon = s.icon;

            return (
              <button
                key={s.step}
                type="button"
                onClick={() => {
                  setActiveStep(s.step);
                  markStepDone(s.step);
                }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: isActive ? `1.5px solid ${s.color}` : '1px solid var(--dark-border)',
                  background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--dark-muted)',
                  fontSize: '11.5px',
                  fontWeight: isActive ? 800 : 600,
                  cursor: 'pointer',
                  minWidth: '110px',
                }}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: isDone ? s.color : 'rgba(255,255,255,0.1)',
                    color: isDone ? '#000' : '#fff',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '10px',
                    fontWeight: 900,
                  }}
                >
                  {isDone ? <Check size={12} /> : s.step}
                </div>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.subtitle}
                </span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Step Hero Card */}
          <div
            style={{
              padding: '20px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${currentStepData.color}40`,
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: `${currentStepData.color}20`,
                  color: currentStepData.color,
                }}
              >
                {currentStepData.badge} • STEP {currentStepData.step} OF 5
              </span>

              <span style={{ fontSize: '12px', color: 'var(--dark-muted)' }}>
                Target Tab: <strong>{currentStepData.targetTab}</strong>
              </span>
            </div>

            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              {currentStepData.title}
            </h2>

            {/* 2-Column Action & Outcome Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '4px' }}>
              {/* What to do */}
              <div
                style={{
                  padding: '14px',
                  background: 'var(--dark-surface)',
                  borderRadius: '8px',
                  border: '1px solid var(--dark-border)',
                }}
              >
                <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--accent)', marginBottom: '6px' }}>
                  👉 WHAT YOU DO (1-2 Minutes):
                </div>
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--dark-text)', lineHeight: 1.55 }}>
                  {currentStepData.whatToDo}
                </p>
              </div>

              {/* What the AI Engine Does */}
              <div
                style={{
                  padding: '14px',
                  background: 'var(--dark-surface)',
                  borderRadius: '8px',
                  border: '1px solid var(--dark-border)',
                }}
              >
                <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#38bdf8', marginBottom: '6px' }}>
                  ⚡ WHAT THE SYSTEM EXECUTES:
                </div>
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--dark-text)', lineHeight: 1.55 }}>
                  {currentStepData.whatHappens}
                </p>
              </div>
            </div>

            {/* Expected End Result Banner */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(199, 255, 85, 0.12) 0%, rgba(20, 28, 22, 0.8) 100%)',
                border: '1px solid rgba(199, 255, 85, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <Target size={18} color="var(--accent)" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent)' }}>
                  EXPECTED COMMERCIAL RESULT:
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                  {currentStepData.expectedResult}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div
          className="modal-footer"
          style={{ padding: '16px 24px', borderTop: '1px solid var(--dark-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            {activeStep > 1 && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setActiveStep(activeStep - 1)}
                style={{ padding: '8px 14px', fontSize: '12px' }}
              >
                ← Previous Step
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onNavigate(currentStepData.targetTab);
                onClose();
              }}
              className="btn-secondary"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: '#fff',
                borderColor: 'var(--dark-border)',
                padding: '8px 14px',
                fontSize: '12.5px',
                fontWeight: 700,
              }}
            >
              Go to {currentStepData.actionText} ↗
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {activeStep < 5 ? (
              <button
                type="button"
                className="btn-accent"
                onClick={() => {
                  markStepDone(activeStep + 1);
                  setActiveStep(activeStep + 1);
                }}
                style={{ padding: '9px 18px', fontSize: '13px', fontWeight: 800 }}
              >
                Next: {stepsData[activeStep].subtitle} <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                className="btn-accent"
                onClick={() => {
                  onNavigate('Client Portal');
                  onClose();
                }}
                style={{ padding: '9px 20px', fontSize: '13px', fontWeight: 800 }}
              >
                🚀 Finish Tour & Launch Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
