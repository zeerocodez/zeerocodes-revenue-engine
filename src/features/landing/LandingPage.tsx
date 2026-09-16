import { useState, type FormEvent } from 'react';
import {
  ArrowRight,
  Bot,
  Check,
  ChevronRight,
  FileSearch,
  Menu,
  Phone,
  Send,
  ShieldCheck,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react';
import './landing.css';
import { apiFetch, readJsonOrThrow } from '../../lib/api';

interface LandingPageProps {
  onLaunchWorkspace: (tab?: string) => void;
}

const leakTypes = [
  {
    id: 'uncontacted',
    title: 'Slow Inbound Response',
    kicker: 'LEAK 01 · SLA BREACH',
    headline: 'High-intent leads decay by 8x after 5 minutes of silence.',
    detail1: 'Inbound requests sit in WhatsApp or inbox queues while reps are offline or context switching.',
    detail2: 'Autonomous decision engine triggers sub-minute qualification or immediate SDR phone routing.',
  },
  {
    id: 'stalled',
    title: 'Mid-Chat Dropoff',
    kicker: 'LEAK 02 · STALLED CONVERSATION',
    headline: 'Buyers ghost when price, timeline, or objection friction goes unhandled.',
    detail1: 'Reps lose track of conversations paused mid-stream, leaving qualified intent unmonitored.',
    detail2: 'Automated objections engine and targeted incentives reactivate stalled buyers within 30 minutes.',
  },
  {
    id: 'no_booking',
    title: 'Qualified But Unbooked',
    kicker: 'LEAK 03 · CONVERSION GAP',
    headline: 'Qualified leads never finalize calendar booking.',
    detail1: 'Sending passive scheduling links creates drop-offs when buyers need guided closing.',
    detail2: 'Escalates to SDR queue with atomic claiming, calendar synchronization, and direct phone prompts.',
  },
  {
    id: 'no_sale',
    title: 'Post-Call Inaction',
    kicker: 'LEAK 04 · CLOSING INERTIA',
    headline: 'Completed meetings languish without commercial follow-through.',
    detail1: 'Closers fail to record structured outcomes or schedule contract milestones.',
    detail2: 'Strict evidence gating requires verified outcome logging or triggers automatic manager escalation.',
  },
  {
    id: 'stale',
    title: 'Untracked Disqualifications',
    kicker: 'LEAK 05 · LOST PIPELINE',
    headline: 'Previously unready leads are never re-engaged when timing matures.',
    detail1: 'Leads marked lost or bad timing are permanently abandoned in traditional spreadsheets.',
    detail2: 'Automated 14-day and 30-day reactivation campaigns re-qualify pipeline without manual SDR labor.',
  },
];

const lifecycleStages = [
  { step: '01', name: 'New', detail: 'Inbound lead captured across WhatsApp, Web, or API with consent verified.', action: 'Sub-minute qualification policy trigger' },
  { step: '02', name: 'Contacting', detail: 'Outbound engagement initiated via automated message or SDR outreach.', action: 'Speed-to-lead SLA timer active' },
  { step: '03', name: 'Engaged', detail: 'Two-way commercial discussion underway to confirm service fit.', action: 'Intent analysis & conversation routing' },
  { step: '04', name: 'Qualifying', detail: 'Deterministic scoring evaluating budget, urgency, and decision-maker.', action: 'Question engine collects missing criteria' },
  { step: '05', name: 'Qualified', detail: 'Lead meets client qualification threshold (e.g. Score >= 70).', action: 'Ready for calendar appointment booking' },
  { step: '06', name: 'Booked', detail: 'Appointment evidence locked (scheduled calendar ID required).', action: 'Handoff to closer with pre-call brief' },
  { step: '07', name: 'Won', detail: 'Strict evidence gate verified: cash ledger attribution recorded.', action: 'Revenue attribution credited to source' },
];

export default function LandingPage({ onLaunchWorkspace }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeLeak, setActiveLeak] = useState(0);
  const [activeStage, setActiveStage] = useState(3);

  // Diagnostic Audit Modal State
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditBusy, setAuditBusy] = useState(false);
  const [auditSuccess, setAuditSuccess] = useState<string | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  async function handleAuditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuditBusy(true);
    setAuditSuccess(null);
    setAuditError(null);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      await readJsonOrThrow(
        await apiFetch('/api/public/audit-requests', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: payload.name,
            business: payload.business,
            email: payload.email,
            phone: payload.phone,
            website: payload.website || undefined,
            monthlyLeadVolume: payload.monthlyLeadVolume,
            currentCrm: payload.currentCrm || undefined,
            biggestSalesBottleneck: payload.biggestSalesBottleneck,
            averageDealValue: payload.averageDealValue ? Number(payload.averageDealValue) : undefined,
            whereLeadsAreLost: payload.whereLeadsAreLost || undefined,
          }),
        }),
        'Audit submission failed'
      );
      setAuditSuccess('Diagnostic request received! Our revenue engineering team will review your pipeline leakage.');
      event.currentTarget.reset();
    } catch (e) {
      setAuditError(e instanceof Error ? e.message : 'Audit submission failed');
    } finally {
      setAuditBusy(false);
    }
  }

  return (
    <div className="landing-shell">
      {/* Navigation */}
      <header className="site-nav">
        <a href="#hero" className="brand-lockup">
          <div className="brand-mark">Z</div>
          <div>
            <strong>ZEEROCODES</strong>
            <small>REVENUE GROWTH ENGINE</small>
          </div>
        </a>

        <nav className={`nav-links ${mobileMenuOpen ? 'nav-links-open' : ''}`}>
          <a href="#operating-chain" onClick={() => setMobileMenuOpen(false)}>Operating Chain</a>
          <a href="#leakage-matrix" onClick={() => setMobileMenuOpen(false)}>Leakage Recovery</a>
          <a href="#sdr-system" onClick={() => setMobileMenuOpen(false)}>SDR Work Queue</a>
          <a href="#architecture" onClick={() => setMobileMenuOpen(false)}>Security & RLS</a>
          <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
        </nav>

        <div className="nav-actions">
          <button
            onClick={() => setShowAuditModal(true)}
            className="text-link"
            style={{ background: 'none', border: 'none' }}
          >
            <FileSearch size={14} /> Request Audit
          </button>
          <button
            onClick={() => onLaunchWorkspace('Overview')}
            className="button button-small"
          >
            Launch Engine <ArrowRight size={13} />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="section-wrap">
        <div className="hero">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-dot" /> PRODUCTION REVENUE OPERATING SYSTEM
            </div>
            <h1>
              Turn leaking leads into <em>captured revenue.</em>
            </h1>
            <p className="hero-lede">
              The autonomous decision and execution layer that sits above your lead sources, SDRs, and closers—making revenue leakage visible, actionable, and mathematically attributed.
            </p>
            <div className="hero-actions">
              <button
                onClick={() => onLaunchWorkspace('Overview')}
                className="button"
              >
                Open Revenue Control Plane <ArrowRight size={15} />
              </button>
              <button
                onClick={() => setShowAuditModal(true)}
                className="button button-ghost"
              >
                Request Free Leak Audit
              </button>
            </div>
            <div className="microcopy">
              <ShieldCheck size={14} /> PostgreSQL RLS Multi-Tenancy · Evidence-Gated Lifecycle · Deterministic Idempotency
            </div>
          </div>

          {/* Interactive Live Control Plane Teaser */}
          <div className="hero-system">
            <div className="system-topline">
              <span>ACTIVE CONTROL PLANE</span>
              <div className="status-chip">
                <span /> ENGINE LIVE
              </div>
            </div>

            <div className="flow-column">
              <div className="flow-step flow-step-active">
                <span className="flow-index">01</span> INTAKE & CONSENT CHECK
                <span className="flow-line" />
              </div>
              <div className="flow-step flow-step-active">
                <span className="flow-index">02</span> DETERMINISTIC SCORING & POLICY
                <span className="flow-line" />
              </div>
              <div className="flow-step flow-step-active">
                <span className="flow-index">03</span> NEXT BEST ACTION & SDR QUEUE
              </div>
            </div>

            <div className="risk-card">
              <div className="risk-label">
                <Zap size={13} /> PRIORITY LEAK MITIGATION
              </div>
              <div className="risk-title">High-Value Lead Stalled in Qualification</div>
              <div className="risk-grid">
                <div>
                  <small>POTENTIAL VALUE</small>
                  <strong>₦350,000 NGN</strong>
                </div>
                <div>
                  <small>IDLE DURATION</small>
                  <strong>32m (SLA Breach)</strong>
                </div>
              </div>
              <div className="risk-action">
                <span>ACTION TRIGGER:</span>
                <b>Atomic Claim & SDR Phone Call</b>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proof Banner Strip */}
      <div className="proof-strip">
        <div>
          <span className="proof-number">01</span>
          <strong>Operating Chain:</strong>
        </div>
        <div className="proof-flow">
          <span>LEAD</span> &rarr; <span>PRIORITY</span> &rarr; <span>DECISION</span> &rarr; <span>NEXT BEST ACTION</span> &rarr; <span>SDR / CLOSER</span> &rarr; <span>LIFECYCLE OUTCOME</span> &rarr; <span>REVENUE ATTRIBUTION</span>
        </div>
      </div>

      {/* Problem & Pipeline Dropoff Section */}
      <section id="operating-chain" className="section-wrap">
        <div className="problem-section">
          <div className="section-intro">
            <div className="eyebrow">THE OPERATIONAL REALITY</div>
            <h2>Spreadsheets cannot run live revenue workflows.</h2>
            <p>
              When lead response times exceed minutes, or when reps lack atomic work queues, sales pipeline leaks at every stage. The engine replaces ad-hoc guesswork with strict rules, qualification gating, and audit trails.
            </p>
          </div>

          <div className="funnel-card">
            <div className="demo-label">ESTIMATED PIPELINE DECAY WITHOUT ENGINE</div>
            <div className="funnel-row">
              <strong>100%</strong>
              <span>INBOUND LEADS</span>
              <div className="funnel-bar"><i style={{ width: '100%' }} /></div>
              <span className="funnel-drop">&darr;</span>
            </div>
            <div className="funnel-row">
              <strong>65%</strong>
              <span>CONTACTED IN SLA</span>
              <div className="funnel-bar"><i style={{ width: '65%' }} /></div>
              <span className="funnel-drop">&darr;</span>
            </div>
            <div className="funnel-row">
              <strong>38%</strong>
              <span>QUALIFIED</span>
              <div className="funnel-bar"><i style={{ width: '38%' }} /></div>
              <span className="funnel-drop">&darr;</span>
            </div>
            <div className="funnel-row">
              <strong>18%</strong>
              <span>MEETINGS BOOKED</span>
              <div className="funnel-bar"><i style={{ width: '18%' }} /></div>
              <span className="funnel-drop">&darr;</span>
            </div>
            <div className="funnel-row">
              <strong>8%</strong>
              <span>WON DEALS</span>
              <div className="funnel-bar"><i style={{ width: '8%' }} /></div>
              <span className="funnel-drop">&check;</span>
            </div>
            <p>
              * Up to 42% of revenue loss occurs in unworked response lags and unqualified closer meetings.
            </p>
          </div>
        </div>
      </section>

      {/* 5 Leakage Engines Matrix */}
      <section id="leakage-matrix" className="section-wrap leak-map">
        <div className="section-intro centered">
          <div className="eyebrow">REVENUE LEAKAGE DETECTION</div>
          <h2>5 Canonical Leak Engines Detected & Recovered</h2>
          <p>
            The engine continuously evaluates lead timestamps, idle states, and qualification criteria to surface high-priority interventions.
          </p>
        </div>

        <div className="leak-layout">
          <div className="leak-list">
            {leakTypes.map((leak, idx) => (
              <button
                key={leak.id}
                onClick={() => setActiveLeak(idx)}
                className={`leak-tab ${activeLeak === idx ? 'leak-tab-active' : ''}`}
              >
                <span>0{idx + 1}</span>
                <strong>{leak.title}</strong>
                <ChevronRight size={14} />
              </button>
            ))}
          </div>

          <div className="leak-detail">
            <div className="detail-kicker">{leakTypes[activeLeak].kicker}</div>
            <h3>{leakTypes[activeLeak].headline}</h3>
            <div className="detail-block">
              <small>WHERE VALUE IS LOST</small>
              <p>{leakTypes[activeLeak].detail1}</p>
            </div>
            <div className="detail-block">
              <small>HOW ZEEROCODES RECOVERS IT</small>
              <p>{leakTypes[activeLeak].detail2}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dark Architecture & Mechanism Section */}
      <section id="architecture" className="dark-section">
        <div className="section-wrap">
          <div className="split-heading">
            <div>
              <div className="eyebrow">ENTERPRISE ARCHITECTURE</div>
              <h2>Engineered for Strict Multi-Tenancy & Zero Trust</h2>
            </div>
            <p>
              Every tenant is strictly separated by PostgreSQL Row-Level Security. Financial wins require deterministic idempotency keys ensuring complete ledger integrity.
            </p>
          </div>

          <div className="mechanism-grid">
            <div className="mechanism-rail">
              <div>
                <i>01</i>
                <b>PostgreSQL Row-Level Security (RLS)</b>
                <strong>Zero cross-tenant data leakage guaranteed at the DB driver layer.</strong>
              </div>
              <div>
                <i>02</i>
                <b>Deterministic Idempotency Keys</b>
                <strong>Idempotent replay protection across appointments, wins, and attributions.</strong>
              </div>
              <div>
                <i>03</i>
                <b>Role-Based Access Control (RBAC)</b>
                <strong>Least-privilege permissions for Viewers, Agents, Managers, and Admins.</strong>
              </div>
            </div>

            <div className="mechanism-cards">
              <div>
                <ShieldCheck size={28} />
                <strong>Evidence-Gated Lifecycle</strong>
                <p>
                  Leads cannot enter <code>booked</code> without an appointment ID, or <code>won</code> without verified commercial revenue.
                </p>
              </div>
              <div>
                <TrendingUp size={28} />
                <strong>Mathematical Recovery Attribution</strong>
                <p>
                  Reclaimed revenue is explicitly tied back to the original leakage opportunity and logged in an immutable audit ledger.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lifecycle Progression Section */}
      <section className="section-wrap lifecycle-section">
        <div className="section-intro">
          <div className="eyebrow">EVIDENCE-GATED PROGRESSION</div>
          <h2>Interactive Lifecycle State Machine</h2>
          <p>Click any stage to examine gating conditions and automated engine actions.</p>
        </div>

        <div className="lifecycle-shell">
          <div className="lifecycle-track">
            {lifecycleStages.map((stage, idx) => (
              <button
                key={stage.name}
                onClick={() => setActiveStage(idx)}
                className={`lifecycle-node ${activeStage === idx ? 'lifecycle-node-active' : ''}`}
              >
                <span>{stage.step}</span>
                <strong>{stage.name}</strong>
                {idx < lifecycleStages.length - 1 && <i />}
              </button>
            ))}
          </div>

          <div className="lifecycle-detail">
            <div>
              <small>ACTIVE LIFECYCLE STAGE</small>
              <h3>{lifecycleStages[activeStage].name} State</h3>
              <p>{lifecycleStages[activeStage].detail}</p>
            </div>
            <div className="next-action">
              <div>
                <small>ENGINE TRIGGER</small>
                <strong>{lifecycleStages[activeStage].action}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SDR Work Queue Highlight */}
      <section id="sdr-system" className="section-wrap sdr-section">
        <div className="sdr-copy">
          <div className="eyebrow">SDR EXECUTION LAYER</div>
          <h2>Empower reps with atomic work claiming & objection scripts.</h2>
          <p>
            SDRs log into a real-time prioritized queue. Work items are atomically claimed to prevent duplicate rep outreach, while the engine automatically generates qualification questions and closing prompts.
          </p>
          <button
            onClick={() => onLaunchWorkspace('SDR Queue')}
            className="text-link"
            style={{ background: 'none', border: 'none', fontWeight: 800 }}
          >
            Launch Live SDR Queue <ArrowRight size={14} />
          </button>
        </div>

        <div className="work-item">
          <div className="work-top">
            <small>SDR QUEUE DISPOSITION CARD</small>
            <span className="priority-badge">PRIORITY: CRITICAL</span>
          </div>
          <h3>Apex Commercial Property</h3>
          <div className="work-score">
            <strong>88</strong>
            <div>
              <span>QUALIFICATION SCORE</span>
              <small>Service Fit + Budget Identified</small>
            </div>
          </div>
          <div className="work-reason">
            <small>RECOMMENDED ACTION</small>
            <strong>Deploy Objection Script: High-Ticket Payment Structure</strong>
          </div>
          <div className="work-meta">
            <span><b>Owner:</b> Auto-Assigned Rep</span>
            <span><b>Channel:</b> WhatsApp</span>
          </div>
          <button
            onClick={() => onLaunchWorkspace('SDR Queue')}
            className="button button-full"
          >
            Claim & Log Disposition
          </button>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="section-wrap solutions-section">
        <div className="section-intro centered">
          <div className="eyebrow">PLATFORM MODULES</div>
          <h2>Full-Stack Revenue Infrastructure</h2>
        </div>

        <div className="solution-grid">
          <div>
            <Users size={22} />
            <h3>Multi-Source Intake</h3>
            <p>Connect website forms, WhatsApp chats, email inboxes, and batch CSV imports into a unified pipeline.</p>
          </div>
          <div>
            <Zap size={22} />
            <h3>Deterministic Scoring</h3>
            <p>Score leads against customizable client weights, budget criteria, and urgency timelines.</p>
          </div>
          <div>
            <Phone size={22} />
            <h3>SDR Execution Queue</h3>
            <p>Atomic claiming, scripted conversation prompts, and structured disposition recording.</p>
          </div>
          <div>
            <TrendingUp size={22} />
            <h3>Revenue Control Plane</h3>
            <p>Live telemetry on pipeline at risk, SLA breaches, and prioritized manager interventions.</p>
          </div>
        </div>
      </section>

      {/* Comparison Grid */}
      <section className="section-wrap" style={{ paddingBottom: '130px' }}>
        <div className="section-intro centered">
          <div className="eyebrow">COMPETITIVE DIFFERENTIATION</div>
          <h2>Why Generic CRMs Still Leak Revenue</h2>
        </div>

        <div className="comparison">
          <div>
            <small>GENERIC SPREADSHEETS</small>
            <strong>Passive records with no SLA monitoring, duplicate entry, and zero automated actions.</strong>
          </div>
          <div>
            <small>STANDALONE CHATBOTS</small>
            <strong>Disconnected conversation logs with no commercial evidence gating or SDR handoffs.</strong>
          </div>
          <div>
            <small>TRADITIONAL CRMS</small>
            <strong>Complex manual data entry without autonomous priority routing or leakage attribution.</strong>
          </div>
          <div className="comparison-highlight">
            <small>ZEEROCODES ENGINE</small>
            <strong>Autonomous decision & execution layer enforcing evidence gates and capturing pipeline value.</strong>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="section-wrap faq-section">
        <div>
          <div className="eyebrow">FREQUENTLY ASKED QUESTIONS</div>
          <h2>Everything you need to know about the engine.</h2>
        </div>

        <div className="faq-list">
          <details open>
            <summary>Does this replace our existing CRM or chat tools?</summary>
            <p>
              No. Zeerocodes sits above your existing tools (WhatsApp, forms, email, CRM) as an autonomous operational decision and routing layer.
            </p>
          </details>
          <details>
            <summary>How does the engine detect revenue leakage?</summary>
            <p>
              The engine continuously scans pipeline records against 5 canonical leak patterns including response SLA breaches, idle qualification chats, and unbooked meetings.
            </p>
          </details>
          <details>
            <summary>Is multi-tenant data isolation guaranteed?</summary>
            <p>
              Yes. Multi-tenancy is enforced via PostgreSQL Row-Level Security (RLS). Every query operates strictly within the active client tenant context.
            </p>
          </details>
          <details>
            <summary>What evidence is required before marking a lead Won?</summary>
            <p>
              Leads must transition through valid lifecycle states (Qualified &rarr; Booked with appointment evidence &rarr; Won with verified revenue attribution).
            </p>
          </details>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="final-cta">
        <div className="section-wrap text-center">
          <div className="eyebrow" style={{ color: '#4a5739' }}>GET STARTED TODAY</div>
          <h2>Stop losing pipeline. Start capturing revenue.</h2>
          <p style={{ margin: '0 auto 30px' }}>
            Request a comprehensive revenue leak audit or explore the live operational workspace right now.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowAuditModal(true)}
              className="button"
            >
              Request Free Leak Audit <ArrowRight size={15} />
            </button>
            <button
              onClick={() => onLaunchWorkspace('Overview')}
              className="button button-ghost"
            >
              Launch Operational Dashboard
            </button>
          </div>
          <small>Instant deployment · 100% auditable revenue ledger</small>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="section-wrap">
          <div className="footer-grid">
            <div className="brand-lockup">
              <div className="brand-mark">Z</div>
              <div>
                <strong style={{ color: '#fff' }}>ZEEROCODES</strong>
                <small>REVENUE GROWTH ENGINE</small>
              </div>
            </div>

            <div>
              <small>WORKSPACES</small>
              <button onClick={() => onLaunchWorkspace('Overview')} className="footer-button">Overview Control Plane</button>
              <button onClick={() => onLaunchWorkspace('Leads')} className="footer-button">Lead Inbox</button>
              <button onClick={() => onLaunchWorkspace('Lead Sources')} className="footer-button">Lead Sources & CSV</button>
              <button onClick={() => onLaunchWorkspace('SDR Queue')} className="footer-button">SDR Work Queue</button>
              <button onClick={() => onLaunchWorkspace('Revenue')} className="footer-button">Revenue Attribution</button>
              <button onClick={() => onLaunchWorkspace('Settings')} className="footer-button">Tenant Policy Settings</button>
            </div>

            <div>
              <small>NAVIGATION</small>
              <a href="#operating-chain">Operating Chain</a>
              <a href="#leakage-matrix">Leakage Recovery</a>
              <a href="#sdr-system">SDR System</a>
              <a href="#architecture">Architecture & RLS</a>
              <a href="#faq">FAQ</a>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Zeerocodes Revenue Growth Engine. All rights reserved.</span>
            <span>Production Operating System · PostgreSQL RLS Active</span>
          </div>
        </div>
      </footer>

      {/* Revenue Leak Audit Modal */}
      {showAuditModal && (
        <div className="modal-backdrop">
          <div className="audit-modal">
            <button
              className="modal-close"
              onClick={() => {
                setShowAuditModal(false);
                setAuditSuccess(null);
                setAuditError(null);
              }}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            {auditSuccess ? (
              <div className="success-state">
                <div className="success-icon">
                  <Check size={28} />
                </div>
                <h2>Diagnostic Request Received</h2>
                <p>{auditSuccess}</p>
                <button
                  onClick={() => {
                    setShowAuditModal(false);
                    setAuditSuccess(null);
                  }}
                  className="button"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="eyebrow">ZEEROCODES DIAGNOSTIC</div>
                <h2>Request a Free Revenue Leak Audit</h2>
                <p className="modal-copy">
                  Our revenue operations engineers will analyze your conversion drop-offs, speed-to-lead SLAs, and pipeline leakage points.
                </p>

                {auditError && <p className="form-error">{auditError}</p>}

                <form onSubmit={(e) => void handleAuditSubmit(e)}>
                  <div className="form-row">
                    <label>
                      Full Name *
                      <input name="name" required placeholder="Alex Rivera" />
                    </label>
                    <label>
                      Company / Business *
                      <input name="business" required placeholder="Apex Advisory Ltd" />
                    </label>
                  </div>

                  <div className="form-row">
                    <label>
                      Work Email *
                      <input name="email" type="email" required placeholder="alex@apexadvisory.com" />
                    </label>
                    <label>
                      Phone / WhatsApp *
                      <input name="phone" required placeholder="+234 800 000 0000" />
                    </label>
                  </div>

                  <div className="form-row">
                    <label>
                      Website (optional)
                      <input name="website" placeholder="https://apexadvisory.com" />
                    </label>
                    <label>
                      Current CRM (optional)
                      <input name="currentCrm" placeholder="HubSpot, Sheets, Zoho" />
                    </label>
                  </div>

                  <div className="form-row">
                    <label>
                      Monthly Inbound Lead Volume *
                      <select name="monthlyLeadVolume" defaultValue="50–200 leads/mo">
                        <option value="Under 50 leads/mo">Under 50 leads/mo</option>
                        <option value="50–200 leads/mo">50–200 leads/mo</option>
                        <option value="200–1,000 leads/mo">200–1,000 leads/mo</option>
                        <option value="1,000+ leads/mo">1,000+ leads/mo</option>
                      </select>
                    </label>
                    <label>
                      Average Deal Value (₦)
                      <input name="averageDealValue" type="number" min="0" placeholder="150000" />
                    </label>
                  </div>

                  <label>
                    Biggest Sales / Revenue Bottleneck *
                    <select name="biggestSalesBottleneck" defaultValue="Slow response to inbound inquiries">
                      <option value="Slow response to inbound inquiries">Slow response time / SLA dropoffs</option>
                      <option value="Leads fall through cracks / unworked">Unworked leads / inconsistent follow-ups</option>
                      <option value="Unqualified bookings wasting closer time">Unqualified meetings wasting sales rep time</option>
                      <option value="Stalled deals with no follow-up triggers">Deals stalling in quote or proposal phase</option>
                      <option value="No attribution from marketing spend to cash">No visibility into which lead sources actually close</option>
                    </select>
                  </label>

                  <label>
                    Where do you suspect leads are getting lost? (optional)
                    <textarea name="whereLeadsAreLost" rows={2} placeholder="e.g. In WhatsApp chats when reps get busy..." />
                  </label>

                  <button
                    type="submit"
                    disabled={auditBusy}
                    className="button button-full"
                  >
                    {auditBusy ? 'Submitting Diagnostic Request…' : 'Submit Free Revenue Audit Request'} <Send size={15} />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
