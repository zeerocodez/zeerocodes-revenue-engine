import { useState, type FormEvent } from 'react';
import {
  ArrowRight,
  Bot,
  Check,
  ChevronRight,
  Clock,
  FileSearch,
  HelpCircle,
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

export default function LandingPage({ onLaunchWorkspace }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
            biggestSalesBottleneck: payload.biggestSalesBottleneck,
          }),
        }),
        'Audit submission failed'
      );
      setAuditSuccess('Audit request received! We will examine your lead-to-sale process and show you where opportunities are being lost.');
      event.currentTarget.reset();
    } catch (e) {
      setAuditError(e instanceof Error ? e.message : 'Audit submission failed');
    } finally {
      setAuditBusy(false);
    }
  }

  const openAudit = () => {
    setMobileMenuOpen(false);
    setShowAuditModal(true);
  };

  return (
    <div className="landing-shell">
      {/* 1. Navigation */}
      <header className="site-nav">
        <a href="#hero" className="brand-lockup">
          <div className="brand-mark">Z</div>
          <div>
            <strong>ZEEROCODES</strong>
            <small>REVENUE ENGINE</small>
          </div>
        </a>

        <nav className={`nav-links ${mobileMenuOpen ? 'nav-links-open' : ''}`}>
          <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
          <a href="#revenue-leakage" onClick={() => setMobileMenuOpen(false)}>Revenue Leakage</a>
          <a href="#who-its-for" onClick={() => setMobileMenuOpen(false)}>Who It's For</a>
          <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
        </nav>

        <div className="nav-actions">
          <button
            type="button"
            onClick={() => onLaunchWorkspace('Overview')}
            className="text-link"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={openAudit}
            className="button button-small"
          >
            BOOK REVENUE AUDIT <ArrowRight size={13} />
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section id="hero" className="section-wrap">
        <div className="hero">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-dot" /> ZEEROCODES REVENUE ENGINE
            </div>
            <h1>
              Turn More of the Leads You Already Have Into <em>Sales.</em>
            </h1>
            <p className="hero-lede">
              You've already spent money, time and effort getting people to enquire. Zeerocodes helps you respond faster, follow up consistently, qualify serious prospects and get the right opportunities to your sales team.
            </p>
            <div className="hero-actions">
              <button
                type="button"
                onClick={openAudit}
                className="button"
              >
                BOOK A REVENUE AUDIT <ArrowRight size={15} />
              </button>
              <a href="#how-it-works" className="button button-ghost">
                See How It Works
              </a>
            </div>
            <p className="hero-subtext" style={{ marginTop: '16px' }}>
              See where your leads are being lost. No obligation.
            </p>
          </div>

          {/* Hero Visual: Lead Pipeline & Stalled Opportunity */}
          <div className="hero-visual-card">
            <div className="visual-header">
              <span>LEAD-TO-SALE FLOW</span>
              <div className="live-badge">
                <span className="live-dot" /> ENGINE ACTIVE
              </div>
            </div>

            {/* Pipeline Steps */}
            <div className="pipeline-track">
              <div className="pipeline-step">
                <span>LEADS</span>
                <strong>100</strong>
              </div>
              <span className="pipeline-arrow">&rarr;</span>
              <div className="pipeline-step">
                <span>CONTACTED</span>
                <strong>72</strong>
              </div>
              <span className="pipeline-arrow">&rarr;</span>
              <div className="pipeline-step">
                <span>QUALIFIED</span>
                <strong>20</strong>
              </div>
              <span className="pipeline-arrow">&rarr;</span>
              <div className="pipeline-step">
                <span>BOOKED</span>
                <strong>8</strong>
              </div>
              <span className="pipeline-arrow">&rarr;</span>
              <div className="pipeline-step">
                <span style={{ color: 'var(--accent)' }}>SOLD</span>
                <strong style={{ color: 'var(--accent)' }}>3</strong>
              </div>
            </div>

            {/* Opportunity At Risk Card */}
            <div className="opportunity-box">
              <div className="opp-badge">
                <div className="opp-badge-label">
                  <Zap size={13} /> REVENUE AT RISK
                </div>
                <span className="opp-badge-tag">NO FOLLOW-UP</span>
              </div>
              <div className="opp-name">David — ABC Consulting</div>
              <div className="opp-grid">
                <div>
                  <small>ESTIMATED VALUE</small>
                  <strong>₦2,000,000 NGN</strong>
                </div>
                <div>
                  <small>CURRENT STATE</small>
                  <strong style={{ color: 'var(--warning)' }}>Qualified (Idle 32m)</strong>
                </div>
              </div>
              <div className="opp-action-block">
                <div className="opp-action-text">
                  <small>NEXT BEST ACTION</small>
                  <strong>High-value lead with no appointment</strong>
                </div>
                <div className="opp-action-btn">
                  CALL NOW &rarr;
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Linear Mechanism Flow Strip */}
      <div className="flow-banner">
        <div className="flow-banner-title">
          <span>THE CONVERSION MECHANISM:</span>
        </div>
        <div className="flow-banner-steps">
          <span>LEAD</span> <i>&rarr;</i>
          <span>FAST RESPONSE</span> <i>&rarr;</i>
          <span>FOLLOW-UP</span> <i>&rarr;</i>
          <span>QUALIFICATION</span> <i>&rarr;</i>
          <span>APPOINTMENT</span> <i>&rarr;</i>
          <span style={{ color: 'var(--ink)' }}>SALE</span>
        </div>
      </div>

      {/* 4. Problem Section */}
      <section className="section-wrap problem-section">
        <div className="section-intro">
          <div className="eyebrow">THE REALITY</div>
          <h2>Your leads are not the problem.</h2>
          <p>
            The money is often lost after the lead comes in. When enquiry handling relies on ad-hoc memory, opportunities slip through the cracks every single day.
          </p>
        </div>

        <div className="problem-grid">
          <div className="problem-card">
            <span className="problem-card-num">GAP 01</span>
            <h3>SLOW RESPONSE</h3>
            <p>
              A new enquiry arrives. Nobody follows up quickly enough while the buyer's intent is highest.
            </p>
          </div>

          <div className="problem-card">
            <span className="problem-card-num">GAP 02</span>
            <h3>LOST FOLLOW-UP</h3>
            <p>
              The prospect showed genuine interest, but after one or two messages, the conversation goes cold.
            </p>
          </div>

          <div className="problem-card">
            <span className="problem-card-num">GAP 03</span>
            <h3>MISSED OPPORTUNITY</h3>
            <p>
              A qualified prospect is sitting in the pipeline, but nobody on the sales team knows what to do next.
            </p>
          </div>
        </div>

        <div className="problem-closer">
          <Check size={18} /> Zeerocodes is built to close those gaps.
        </div>
      </section>

      {/* 5. The Offer: One System. One Job. */}
      <section className="offer-section">
        <div className="section-wrap">
          <div className="eyebrow">THE OPERATING SYSTEM</div>
          <h2>One system. One job.</h2>
          <div className="offer-lead">Turn more of your existing leads into revenue.</div>

          <div className="offer-steps-grid">
            <div className="offer-step-card">
              <span>01. RESPOND</span>
              <h3>Fast Intake</h3>
              <p>New leads are engaged quickly across your channels before intent decays.</p>
            </div>

            <div className="offer-step-card">
              <span>02. QUALIFY</span>
              <h3>Filter Serious Fit</h3>
              <p>Identify who is actually worth your sales team's time and budget requirements.</p>
            </div>

            <div className="offer-step-card">
              <span>03. FOLLOW UP</span>
              <h3>Consistent Cadence</h3>
              <p>Keep opportunities moving instead of letting them disappear into silence.</p>
            </div>

            <div className="offer-step-card">
              <span>04. PRIORITISE</span>
              <h3>Clear Direction</h3>
              <p>Tell your team which opportunity needs immediate attention right now.</p>
            </div>

            <div className="offer-step-card">
              <span>05. CONVERT</span>
              <h3>Closed Deals</h3>
              <p>Move qualified opportunities toward booked appointments and verified sales.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. "How It Works" */}
      <section id="how-it-works" className="section-wrap how-it-works-section">
        <div className="section-intro" style={{ textAlign: 'center' }}>
          <div className="eyebrow" style={{ justifyContent: 'center' }}>STEP-BY-STEP PROCESS</div>
          <h2>From lead to sale.</h2>
          <p style={{ margin: '0 auto' }}>
            A disciplined progression from the moment an enquiry lands to the completed deal.
          </p>
        </div>

        <div className="process-chain">
          <div className="process-node">
            <div className="process-node-num">1</div>
            <strong>LEAD</strong>
          </div>
          <span className="process-divider">&rarr;</span>

          <div className="process-node">
            <div className="process-node-num">2</div>
            <strong>RESPOND</strong>
          </div>
          <span className="process-divider">&rarr;</span>

          <div className="process-node">
            <div className="process-node-num">3</div>
            <strong>QUALIFY</strong>
          </div>
          <span className="process-divider">&rarr;</span>

          <div className="process-node">
            <div className="process-node-num">4</div>
            <strong>BOOK</strong>
          </div>
          <span className="process-divider">&rarr;</span>

          <div className="process-node">
            <div className="process-node-num">5</div>
            <strong>CLOSE</strong>
          </div>
          <span className="process-divider">&rarr;</span>

          <div className="process-node">
            <div className="process-node-num" style={{ background: 'var(--ink)', color: 'var(--accent)' }}>6</div>
            <strong style={{ color: 'var(--accent-deep)' }}>REVENUE</strong>
          </div>
        </div>

        <p className="process-caption">
          Zeerocodes sits in the middle of this process and helps your team keep opportunities moving.
        </p>
      </section>

      {/* 7. Revenue Leakage Funnel */}
      <section id="revenue-leakage" className="leakage-section">
        <div className="section-wrap">
          <div className="section-intro">
            <div className="eyebrow">REVENUE LEAKAGE AUDIT</div>
            <h2>Find the sales you're already losing.</h2>
            <p>
              Instead of immediately asking you to generate more leads, we first look at what is happening to the leads you already have.
            </p>
          </div>

          <div className="funnel-breakdown-card">
            <div className="funnel-table">
              <div className="funnel-row-item">
                <div className="funnel-row-stat">
                  <strong>100 Leads</strong>
                  <span>TOTAL ENQUIRIES</span>
                </div>
                <div className="funnel-progress-bar">
                  <i style={{ width: '100%' }} />
                </div>
                <div className="funnel-row-gap" style={{ color: 'var(--muted)' }}>Initial Baseline</div>
              </div>

              <div className="funnel-row-item">
                <div className="funnel-row-stat">
                  <strong>72 Contacted</strong>
                  <span>REACHED IN TIME</span>
                </div>
                <div className="funnel-progress-bar">
                  <i style={{ width: '72%' }} />
                </div>
                <div className="funnel-row-gap">28 lost to slow response</div>
              </div>

              <div className="funnel-row-item">
                <div className="funnel-row-stat">
                  <strong>45 Engaged</strong>
                  <span>ACTIVE DIALOGUE</span>
                </div>
                <div className="funnel-progress-bar">
                  <i style={{ width: '45%' }} />
                </div>
                <div className="funnel-row-gap">27 ghosted / stalled</div>
              </div>

              <div className="funnel-row-item">
                <div className="funnel-row-stat">
                  <strong>20 Qualified</strong>
                  <span>FIT CONFIRMED</span>
                </div>
                <div className="funnel-progress-bar">
                  <i style={{ width: '20%' }} />
                </div>
                <div className="funnel-row-gap">25 lost in qualification</div>
              </div>

              <div className="funnel-row-item">
                <div className="funnel-row-stat">
                  <strong>8 Booked</strong>
                  <span>MEETINGS ON CALENDAR</span>
                </div>
                <div className="funnel-progress-bar">
                  <i style={{ width: '8%' }} />
                </div>
                <div className="funnel-row-gap">12 qualified but unbooked</div>
              </div>

              <div className="funnel-row-item" style={{ background: 'var(--accent-bg)', borderColor: '#cfe0cb' }}>
                <div className="funnel-row-stat">
                  <strong style={{ color: 'var(--accent-deep)' }}>3 Won</strong>
                  <span>CLOSED SALES</span>
                </div>
                <div className="funnel-progress-bar">
                  <i style={{ width: '3%' }} />
                </div>
                <div className="funnel-row-gap" style={{ color: 'var(--accent-deep)' }}>5 lost post-meeting</div>
              </div>
            </div>

            <div className="funnel-footer-note">
              <span>* Illustrative example. Every gap is an opportunity to investigate.</span>
              <button
                type="button"
                onClick={openAudit}
                className="button button-small"
              >
                FIND MY REVENUE LEAKS <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. What Zeerocodes Does (4 Cards Only) */}
      <section className="section-wrap pillars-section">
        <div className="section-intro">
          <div className="eyebrow">CORE CAPABILITIES</div>
          <h2>What Zeerocodes does.</h2>
          <p>Four disciplined operational capabilities to prevent pipeline decay.</p>
        </div>

        <div className="pillars-grid">
          <div className="pillar-card">
            <div className="pillar-card-icon"><Clock size={20} /></div>
            <h3>FAST FOLLOW-UP</h3>
            <p>Respond to new opportunities before they go cold and establish immediate commercial dialogue.</p>
          </div>

          <div className="pillar-card">
            <div className="pillar-card-icon"><ShieldCheck size={20} /></div>
            <h3>SMART QUALIFICATION</h3>
            <p>Identify prospects that fit your offer, budget, and timeline so reps don't waste hours.</p>
          </div>

          <div className="pillar-card">
            <div className="pillar-card-icon"><TrendingUp size={20} /></div>
            <h3>SALES PRIORITY</h3>
            <p>Give your sales reps a clear, real-time answer to "who should I contact next?"</p>
          </div>

          <div className="pillar-card">
            <div className="pillar-card-icon"><Zap size={20} /></div>
            <h3>REVENUE RECOVERY</h3>
            <p>Find stalled opportunities in your pipeline that deserve another action before being lost.</p>
          </div>
        </div>
      </section>

      {/* 9. AI (One Short Block) */}
      <section className="section-wrap ai-block-section">
        <div className="ai-block-card">
          <div>
            <div className="eyebrow">HUMAN + MACHINE BALANCE</div>
            <h2>Let AI handle the repetition. Let your team handle the sale.</h2>
            <p>
              AI can respond, follow up and qualify. Your people handle conversations that require judgment, negotiation and closing.
            </p>
          </div>

          <div className="ai-division-box">
            <div className="ai-div-item">
              <strong>AI JOBS</strong>
              <span>Sub-minute greeting, qualification questionnaires, scheduled follow-up triggers.</span>
            </div>
            <div className="ai-div-item">
              <strong>REP JOBS</strong>
              <span>Discovery meetings, custom proposals, objection handling, final contract signing.</span>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Product Screen: Realistic Opportunity Card */}
      <section className="section-wrap product-preview-section">
        <div className="product-preview-layout">
          <div>
            <div className="eyebrow">PRODUCT PREVIEW</div>
            <h2>What it actually looks like.</h2>
            <p style={{ color: 'var(--muted)', fontSize: '16px', lineHeight: 1.6 }}>
              Every lead in your pipeline has a clear status, estimated deal value, SLA timer, and a deterministic <strong>Next Best Action</strong>.
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '12px' }}>
              Your sales reps never have to guess who needs attention. The engine tells them exactly who to call, message, or escalate.
            </p>
          </div>

          <div className="opportunity-card-full">
            <div className="opp-full-header">
              <span>QUALIFIED OPPORTUNITY</span>
              <small>DEMO DATA</small>
            </div>

            <div className="opp-full-body">
              <h3>David — ABC Consulting</h3>
              <div className="opp-detail-table">
                <div>
                  <small>ESTIMATED VALUE</small>
                  <strong>₦2,000,000 NGN</strong>
                </div>
                <div>
                  <small>BUYER INTENT</small>
                  <strong>Ready to book</strong>
                </div>
                <div>
                  <small>CURRENT STATE</small>
                  <strong style={{ color: 'var(--accent)' }}>Qualified</strong>
                </div>
                <div>
                  <small>SLA STATUS</small>
                  <strong style={{ color: 'var(--warning)' }}>At risk (32m idle)</strong>
                </div>
              </div>
            </div>

            <div className="opp-nba-block">
              <small>NEXT BEST ACTION</small>
              <div className="opp-nba-callout">
                <div>
                  <strong>CALL NOW</strong>
                  <p>Why: High-value qualified lead with no appointment.</p>
                </div>
                <button
                  type="button"
                  onClick={() => onLaunchWorkspace('SDR Queue')}
                  className="button button-small"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <Phone size={13} /> View SDR Queue
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. Who It Is For & Not For */}
      <section id="who-its-for" className="section-wrap audience-section">
        <div className="section-intro">
          <div className="eyebrow">TARGET FIT</div>
          <h2>Built for businesses that already have leads.</h2>
          <p>
            Zeerocodes is designed specifically for organizations that generate enquiries but lose deals due to operational follow-up friction.
          </p>
        </div>

        <div className="audience-grid">
          <div className="audience-card">
            <h3>SERVICE BUSINESSES</h3>
            <p>"Enquiries come in, but follow-up is inconsistent across busy weeks."</p>
          </div>

          <div className="audience-card">
            <h3>PROFESSIONAL SERVICES</h3>
            <p>"High-value prospects need disciplined qualification and structured follow-through."</p>
          </div>

          <div className="audience-card">
            <h3>SALES TEAMS</h3>
            <p>"Your reps need to know which opportunities deserve attention first."</p>
          </div>
        </div>

        {/* Who It Is Not For */}
        <div className="not-for-box">
          <div>
            <div className="eyebrow" style={{ color: '#88988a' }}>HONEST CRITERIA</div>
            <h3>This works best when you already have leads.</h3>
          </div>
          <div>
            <p style={{ margin: '0 0 8px', fontWeight: 650, fontSize: '13px', color: 'var(--ink)' }}>Not ideal if:</p>
            <ul>
              <li>You have no active lead flow</li>
              <li>You have no defined offer or pricing structure</li>
              <li>You expect software alone to magically close deals without sales execution</li>
            </ul>
            <p style={{ margin: '12px 0 0', fontWeight: 600, fontSize: '13px', color: 'var(--accent-deep)' }}>
              ✓ Ideal if: You already have enquiries and want to convert more of them.
            </p>
          </div>
        </div>
      </section>

      {/* 12. The Offer / Revenue Audit Form Section */}
      <section id="audit" className="audit-cta-section">
        <div className="section-wrap">
          <div className="audit-layout">
            <div className="audit-copy">
              <div className="eyebrow">START HERE</div>
              <h2>Start with a Revenue Audit.</h2>
              <p>
                We'll look at your current lead-to-sale process and identify where opportunities are being lost.
              </p>

              <ul className="audit-checklist">
                <li><Check size={18} /> Where leads are going cold</li>
                <li><Check size={18} /> Where follow-up is breaking down</li>
                <li><Check size={18} /> Where your sales team should focus first</li>
              </ul>

              <div className="pilot-tag">
                Followed by a structured 30-Day Revenue Pilot for qualified businesses.
              </div>

              <p style={{ fontSize: '13px', color: 'var(--dark-muted)', marginTop: '18px' }}>
                No obligation. We'll identify the gaps before recommending anything.
              </p>
            </div>

            {/* Inline Audit Form */}
            <div className="audit-form-card">
              <h3>Find Your Revenue Leaks</h3>
              <p>Submit your details to request a comprehensive revenue leak audit.</p>

              {auditSuccess ? (
                <div className="success-state">
                  <div className="success-icon">
                    <Check size={26} />
                  </div>
                  <h2>Audit Request Received</h2>
                  <p>{auditSuccess}</p>
                  <button
                    type="button"
                    onClick={() => setAuditSuccess(null)}
                    className="button button-small"
                  >
                    Submit Another Request
                  </button>
                </div>
              ) : (
                <form onSubmit={(e) => void handleAuditSubmit(e)}>
                  {auditError && <p className="form-error">{auditError}</p>}

                  <div className="form-row">
                    <label>
                      Name *
                      <input name="name" required placeholder="Alex Rivera" />
                    </label>
                    <label>
                      Business Name *
                      <input name="business" required placeholder="Apex Consulting Ltd" />
                    </label>
                  </div>

                  <div className="form-row">
                    <label>
                      Email *
                      <input name="email" type="email" required placeholder="alex@apex.com" />
                    </label>
                    <label>
                      Phone / WhatsApp *
                      <input name="phone" required placeholder="+234 800 000 0000" />
                    </label>
                  </div>

                  <label>
                    Website (optional)
                    <input name="website" placeholder="https://apex.com" />
                  </label>

                  <label>
                    Approximate Monthly Lead Volume *
                    <select name="monthlyLeadVolume" defaultValue="50–200 leads/mo">
                      <option value="Under 50 leads/mo">Under 50 leads/mo</option>
                      <option value="50–200 leads/mo">50–200 leads/mo</option>
                      <option value="200–1,000 leads/mo">200–1,000 leads/mo</option>
                      <option value="1,000+ leads/mo">1,000+ leads/mo</option>
                    </select>
                  </label>

                  <label>
                    Biggest Sales Problem *
                    <select name="biggestSalesBottleneck" defaultValue="Slow response to inbound inquiries">
                      <option value="Slow response to inbound inquiries">Slow response to inbound inquiries</option>
                      <option value="Leads fall through cracks / unworked">Leads fall through cracks / inconsistent follow-up</option>
                      <option value="Unqualified bookings wasting closer time">Unqualified bookings wasting closer time</option>
                      <option value="Stalled deals with no follow-up triggers">Stalled deals with no follow-up triggers</option>
                      <option value="No attribution from marketing spend to cash">No attribution from marketing spend to cash</option>
                    </select>
                  </label>

                  <button
                    type="submit"
                    disabled={auditBusy}
                    className="button button-full"
                    style={{ marginTop: '8px' }}
                  >
                    {auditBusy ? 'Submitting Request…' : 'FIND MY REVENUE LEAKS'} <Send size={14} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 13. FAQ (5 Questions Only) */}
      <section id="faq" className="section-wrap faq-section">
        <div>
          <div className="eyebrow">COMMON QUESTIONS</div>
          <h2>Frequently Asked Questions</h2>
          <p style={{ color: 'var(--muted)', fontSize: '15px', marginTop: '12px' }}>
            Everything you need to know about how the Revenue Engine works.
          </p>
        </div>

        <div className="faq-list">
          <details open>
            <summary>Do I need more leads?</summary>
            <p>
              Not necessarily. Zeerocodes starts by helping you convert more of the leads you're already generating.
            </p>
          </details>

          <details>
            <summary>Does it replace my CRM?</summary>
            <p>
              No. Zeerocodes works around your existing lead and sales process.
            </p>
          </details>

          <details>
            <summary>Does it replace my sales team?</summary>
            <p>
              No. It helps your team know which opportunities need attention and what should happen next.
            </p>
          </details>

          <details>
            <summary>What does the system actually do?</summary>
            <p>
              It helps respond, follow up, qualify, prioritise and recover sales opportunities.
            </p>
          </details>

          <details>
            <summary>Can you guarantee more sales?</summary>
            <p>
              No. Results depend on lead quality, your offer, sales execution and market conditions. The system is designed to improve the process between lead and revenue.
            </p>
          </details>
        </div>
      </section>

      {/* 14. Final CTA */}
      <section className="final-cta">
        <div className="section-wrap">
          <h2>How many sales are sitting inside your existing leads?</h2>
          <p>
            Let's find out where your lead-to-sale process is leaking opportunities.
          </p>
          <div className="final-cta-actions">
            <button
              type="button"
              onClick={openAudit}
              className="button"
            >
              BOOK A REVENUE AUDIT <ArrowRight size={15} />
            </button>
            <button
              type="button"
              onClick={() => onLaunchWorkspace('Overview')}
              className="button button-ghost"
            >
              Launch Operational Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* 15. Footer */}
      <footer className="site-footer">
        <div className="section-wrap">
          <div className="footer-grid">
            <div>
              <div className="brand-lockup">
                <div className="brand-mark">Z</div>
                <div>
                  <strong style={{ color: '#fff' }}>ZEEROCODES</strong>
                  <small>REVENUE GROWTH ENGINE</small>
                </div>
              </div>
              <p style={{ color: 'var(--dark-muted)', fontSize: '13px', marginTop: '14px', maxWidth: '320px' }}>
                "Turn more of the leads you already have into sales."
              </p>
            </div>

            <div>
              <small>WORKSPACES</small>
              <button type="button" onClick={() => onLaunchWorkspace('Overview')} className="footer-button">Overview Control Plane</button>
              <button type="button" onClick={() => onLaunchWorkspace('Leads')} className="footer-button">Lead Inbox</button>
              <button type="button" onClick={() => onLaunchWorkspace('Lead Sources')} className="footer-button">Lead Sources & CSV</button>
              <button type="button" onClick={() => onLaunchWorkspace('SDR Queue')} className="footer-button">SDR Work Queue</button>
              <button type="button" onClick={() => onLaunchWorkspace('Revenue')} className="footer-button">Revenue Attribution</button>
              <button type="button" onClick={() => onLaunchWorkspace('Settings')} className="footer-button">Tenant Policy Settings</button>
            </div>

            <div>
              <small>NAVIGATION</small>
              <a href="#how-it-works">How It Works</a>
              <a href="#revenue-leakage">Revenue Leakage</a>
              <a href="#who-its-for">Who It's For</a>
              <a href="#faq">FAQ</a>
              <a href="#audit" onClick={openAudit}>Book Revenue Audit</a>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Zeerocodes Revenue Growth Engine. All rights reserved.</span>
            <span>Turn more of the leads you already have into sales.</span>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky Bottom CTA */}
      <div className="mobile-sticky-cta">
        <button
          type="button"
          onClick={openAudit}
          className="button button-full"
        >
          BOOK REVENUE AUDIT <ArrowRight size={14} />
        </button>
      </div>

      {/* 16. Revenue Leak Audit Modal */}
      {showAuditModal && (
        <div className="modal-backdrop">
          <div className="audit-modal">
            <button
              type="button"
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
                  <Check size={26} />
                </div>
                <h2>Audit Request Received</h2>
                <p>{auditSuccess}</p>
                <button
                  type="button"
                  onClick={() => {
                    setShowAuditModal(false);
                    setAuditSuccess(null);
                  }}
                  className="button button-small"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="eyebrow">ZEEROCODES REVENUE AUDIT</div>
                <h2>Find Your Revenue Leaks</h2>
                <p className="modal-copy">
                  Tell us about your current sales process and lead flow. We'll identify where opportunities are slipping through the cracks.
                </p>

                {auditError && <p className="form-error">{auditError}</p>}

                <form onSubmit={(e) => void handleAuditSubmit(e)}>
                  <div className="form-row">
                    <label>
                      Name *
                      <input name="name" required placeholder="Alex Rivera" />
                    </label>
                    <label>
                      Business Name *
                      <input name="business" required placeholder="Apex Consulting Ltd" />
                    </label>
                  </div>

                  <div className="form-row">
                    <label>
                      Email *
                      <input name="email" type="email" required placeholder="alex@apex.com" />
                    </label>
                    <label>
                      Phone / WhatsApp *
                      <input name="phone" required placeholder="+234 800 000 0000" />
                    </label>
                  </div>

                  <label>
                    Website (optional)
                    <input name="website" placeholder="https://apex.com" />
                  </label>

                  <label>
                    Approximate Monthly Lead Volume *
                    <select name="monthlyLeadVolume" defaultValue="50–200 leads/mo">
                      <option value="Under 50 leads/mo">Under 50 leads/mo</option>
                      <option value="50–200 leads/mo">50–200 leads/mo</option>
                      <option value="200–1,000 leads/mo">200–1,000 leads/mo</option>
                      <option value="1,000+ leads/mo">1,000+ leads/mo</option>
                    </select>
                  </label>

                  <label>
                    Biggest Sales Problem *
                    <select name="biggestSalesBottleneck" defaultValue="Slow response to inbound inquiries">
                      <option value="Slow response to inbound inquiries">Slow response to inbound inquiries</option>
                      <option value="Leads fall through cracks / unworked">Leads fall through cracks / inconsistent follow-up</option>
                      <option value="Unqualified bookings wasting closer time">Unqualified bookings wasting closer time</option>
                      <option value="Stalled deals with no follow-up triggers">Stalled deals with no follow-up triggers</option>
                      <option value="No attribution from marketing spend to cash">No attribution from marketing spend to cash</option>
                    </select>
                  </label>

                  <button
                    type="submit"
                    disabled={auditBusy}
                    className="button button-full"
                    style={{ marginTop: '8px' }}
                  >
                    {auditBusy ? 'Submitting Request…' : 'FIND MY REVENUE LEAKS'} <Send size={14} />
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
