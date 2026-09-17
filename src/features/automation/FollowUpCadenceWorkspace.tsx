import { useState } from 'react';
import {
  ArrowDown,
  Bot,
  Calendar,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  Play,
  Plus,
  Power,
  Settings,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Zap,
} from 'lucide-react';
import type { UserSession } from '../auth/AuthModal';

interface CadenceStep {
  id: string;
  stepNumber: number;
  delayText: string;
  channel: 'whatsapp' | 'sms' | 'email' | 'call';
  subject?: string;
  templateBody: string;
  openRate: string;
  replyRate: string;
}

interface CadenceSequence {
  id: string;
  title: string;
  description: string;
  targetAudience: string;
  active: boolean;
  enrolledCount: number;
  completedCount: number;
  revenueGenerated: number;
  steps: CadenceStep[];
}

const SAMPLE_CADENCES: CadenceSequence[] = [
  {
    id: 'cad_1',
    title: 'High-Intent Inbound Fast-Track Cadence',
    description: 'Instant speed-to-lead qualification sequence triggered immediately upon web/ad lead submission.',
    targetAudience: 'Meta Ads & Google Search Leads (Score > 65)',
    active: true,
    enrolledCount: 428,
    completedCount: 312,
    revenueGenerated: 18400000,
    steps: [
      {
        id: 's1',
        stepNumber: 1,
        delayText: 'Immediate (within 45 seconds)',
        channel: 'whatsapp',
        templateBody: 'Hello {{lead.name}}! Thank you for reaching out to {{tenant.name}}. I noticed you are interested in accelerating sales for {{lead.company}}. Are you looking to launch this month?',
        openRate: '98.2%',
        replyRate: '71.4%',
      },
      {
        id: 's2',
        stepNumber: 2,
        delayText: 'Wait 4 Hours (if no reply)',
        channel: 'sms',
        templateBody: 'Hi {{lead.name}}, our senior solutions advisor has 2 slots open for a 15-min walkthrough. Tap here to pick a time: {{booking.link}}',
        openRate: '94.0%',
        replyRate: '38.6%',
      },
      {
        id: 's3',
        stepNumber: 3,
        delayText: 'Wait 24 Hours',
        channel: 'email',
        subject: 'Case Study: How B2B leaders recovered 35% leaked pipeline',
        templateBody: 'Hi {{lead.name}},\n\nSharing how similar companies in your industry eliminated speed-to-lead bottlenecks. Let us know if you would like to explore this for {{lead.company}}.',
        openRate: '62.5%',
        replyRate: '24.1%',
      },
    ],
  },
  {
    id: 'cad_2',
    title: 'Post-Demo Closing & Board Review Drip',
    description: 'Follow-up sequence for leads who completed demonstration but have not yet executed agreements.',
    targetAudience: 'Booked / Completed Demo Stage',
    active: true,
    enrolledCount: 86,
    completedCount: 54,
    revenueGenerated: 12200000,
    steps: [
      {
        id: 's2_1',
        stepNumber: 1,
        delayText: '2 Hours post-demo',
        channel: 'whatsapp',
        templateBody: 'Hi {{lead.name}}, great speaking today! Here is the summary brief and recording from our call: {{demo.recording_url}}',
        openRate: '100%',
        replyRate: '84.0%',
      },
      {
        id: 's2_2',
        stepNumber: 2,
        delayText: 'Wait 3 Days',
        channel: 'email',
        subject: 'Commercial terms & SLA onboarding timeline for {{lead.company}}',
        templateBody: 'Hi {{lead.name}},\n\nFollowing up to see if the leadership team had any questions on the proposal terms.',
        openRate: '78.4%',
        replyRate: '45.0%',
      },
    ],
  },
];

interface FollowUpCadenceWorkspaceProps {
  session: UserSession;
}

export default function FollowUpCadenceWorkspace({ session }: FollowUpCadenceWorkspaceProps) {
  const [cadences, setCadences] = useState<CadenceSequence[]>(SAMPLE_CADENCES);
  const [selectedCadenceId, setSelectedCadenceId] = useState<string>(SAMPLE_CADENCES[0].id);

  const activeCadence = cadences.find((c) => c.id === selectedCadenceId) || cadences[0];

  const toggleCadence = (id: string) => {
    setCadences((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c))
    );
  };

  return (
    <div className="dashboard-canvas">
      {/* View Header */}
      <div className="view-header">
        <div className="view-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="role-badge superadmin">Automation Engine</span>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Tenant: <strong>{session.tenantName}</strong></span>
          </div>
          <h1>
            Automated Follow-up Sequences & Cadences
            <span style={{ fontSize: '13px', background: 'var(--accent-bg)', color: 'var(--accent-deep)', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
              Autonomous AI Outreach
            </span>
          </h1>
          <p>Design multi-channel follow-up cadences across WhatsApp, SMS, and Email to eliminate dropped deals.</p>
        </div>

        <div className="view-actions">
          <button className="btn-accent" onClick={() => alert('New Cadence builder opened!')}>
            <Plus size={16} /> Create Cadence
          </button>
        </div>
      </div>

      {/* Cadences Overview Selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {cadences.map((cad) => {
          const isSelected = cad.id === activeCadence.id;
          return (
            <div
              key={cad.id}
              onClick={() => setSelectedCadenceId(cad.id)}
              style={{
                background: isSelected ? 'var(--white)' : 'var(--paper)',
                border: isSelected ? '2px solid var(--ink)' : '1px solid var(--line)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px 20px',
                cursor: 'pointer',
                boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                transition: 'all 0.18s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className={`status-pill ${cad.active ? 'won' : 'lost'}`}>
                  {cad.active ? '● Active Cadence' : '○ Paused'}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCadence(cad.id);
                  }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: cad.active ? '#16a34a' : 'var(--muted)' }}
                >
                  <Power size={18} />
                </button>
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--ink)' }}>{cad.title}</h3>
              <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: '0 0 12px 0' }}>{cad.description}</p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', borderTop: '1px dashed var(--line)', paddingTop: '10px' }}>
                <span><strong>{cad.enrolledCount}</strong> Leads Enrolled</span>
                <span style={{ color: '#16a34a', fontWeight: 800 }}>₦{cad.revenueGenerated.toLocaleString()} Won</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Sequence Steps Flow */}
      <div className="table-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 4px 0' }}>
              Sequence Flow: {activeCadence.title}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0 }}>
              Trigger Target: <strong style={{ color: 'var(--ink)' }}>{activeCadence.targetAudience}</strong>
            </p>
          </div>
          <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12.5px' }} onClick={() => alert('Add Step to sequence')}>
            <Plus size={14} /> Add Step
          </button>
        </div>

        {/* Steps Stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {activeCadence.steps.map((step, idx) => (
            <div key={step.id}>
              <div
                style={{
                  background: 'var(--paper)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '20px',
                }}
              >
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flex: 1 }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--ink)', color: 'var(--accent)', display: 'grid', placeItems: 'center', fontSize: '14px', fontWeight: 800, flexShrink: 0 }}>
                    {step.stepNumber}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span className="status-pill" style={{ textTransform: 'uppercase', background: step.channel === 'whatsapp' ? '#dcfce7' : step.channel === 'email' ? '#e0f2fe' : '#fef3c7', color: step.channel === 'whatsapp' ? '#166534' : step.channel === 'email' ? '#0369a1' : '#b45309' }}>
                        {step.channel}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} /> {step.delayText}
                      </span>
                    </div>

                    {step.subject && (
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
                        Subject: {step.subject}
                      </div>
                    )}

                    <div style={{ fontSize: '13px', color: 'var(--ink)', background: 'var(--white)', border: '1px solid var(--line)', padding: '10px 14px', borderRadius: '8px', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                      {step.templateBody}
                    </div>
                  </div>
                </div>

                {/* Step Analytics */}
                <div style={{ display: 'flex', gap: '16px', textAlign: 'right', flexShrink: 0 }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>Open Rate</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink)', marginTop: '2px' }}>{step.openRate}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>Reply Rate</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#16a34a', marginTop: '2px' }}>{step.replyRate}</div>
                  </div>
                </div>
              </div>

              {idx < activeCadence.steps.length - 1 && (
                <div style={{ display: 'grid', placeItems: 'center', margin: '6px 0' }}>
                  <ArrowDown size={18} color="var(--muted)" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
