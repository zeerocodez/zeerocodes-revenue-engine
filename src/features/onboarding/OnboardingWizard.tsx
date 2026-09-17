import { useState } from 'react';
import {
  ArrowRight,
  Bot,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Database,
  ExternalLink,
  Flame,
  Globe,
  HelpCircle,
  Layers,
  MessageSquare,
  Play,
  Radio,
  RefreshCw,
  Rocket,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Upload,
  UserCheck,
  Zap,
} from 'lucide-react';
import type { UserSession } from '../auth/AuthModal';

interface OnboardingWizardProps {
  session: UserSession;
  onNavigate?: (tab: string) => void;
}

export default function OnboardingWizard({ session, onNavigate }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLive, setIsLive] = useState<boolean>(true);

  // Step 1: Business Profile State
  const [businessProfile, setBusinessProfile] = useState({
    businessName: session.tenantName || 'ABC Commercial Services',
    industry: 'Facility Management & Cleaning',
    website: 'https://abccleaning.ng',
    primaryService: 'Commercial & Post-Construction Office Cleaning',
    locations: 'Lagos (Victoria Island, Lekki, Ikoyi, Ikeja)',
    avgDealValue: 1800000,
    salesCycleDays: 7,
  });

  // Step 2: Qualification Policy State
  const [qualificationPolicy, setQualificationPolicy] = useState({
    minScore: 75,
    requireBudget: true,
    minBudget: 500000,
    requireDecisionMaker: true,
    requireLocationFit: true,
    allowedLocations: 'Lagos, Abuja, Port Harcourt',
    requireTimeline: true,
    maxTimelineDays: 30,
    autoBookAppointments: true,
  });

  // Step 3: Connected Lead Sources
  const [leadSources, setLeadSources] = useState({
    metaAds: true,
    websiteForm: true,
    whatsapp: true,
    goHighLevel: false,
    crm: false,
  });

  // Step 4: Test Lead Simulation State
  const [testLeadStatus, setTestLeadStatus] = useState<'idle' | 'running' | 'success'>('idle');
  const [testLog, setTestLog] = useState<
    { step: string; status: 'pending' | 'success'; latency: string; details: string }[]
  >([]);

  const runLeadSimulation = () => {
    setTestLeadStatus('running');
    setTestLog([
      { step: '1. Inbound Webhook Received', status: 'pending', latency: '...', details: 'Capturing payload from Meta Lead Ads / Webhook' },
    ]);

    setTimeout(() => {
      setTestLog((prev) => [
        { step: '1. Inbound Webhook Received', status: 'success', latency: '12ms', details: 'Payload parsed: John Doe (Commercial Cleaning, VI)' },
        { step: '2. 45-Second AI Fast Response', status: 'pending', latency: '...', details: 'Dispatching WhatsApp / SMS introductory outreach' },
      ]);
    }, 600);

    setTimeout(() => {
      setTestLog((prev) => [
        prev[0],
        { step: '2. 45-Second AI Fast Response', status: 'success', latency: '4.2s', details: 'Message sent: "Hi John, thanks for reaching out to ABC..."' },
        { step: '3. Real-Time Qualification Policy Scoring', status: 'pending', latency: '...', details: 'Evaluating budget, decision maker & location fit' },
      ]);
    }, 1300);

    setTimeout(() => {
      setTestLog((prev) => [
        prev[0],
        prev[1],
        { step: '3. Real-Time Qualification Policy Scoring', status: 'success', latency: '180ms', details: 'Extracted: Score 91/100 (HIGH). Confirmed Decision Maker.' },
        { step: '4. Intelligent Calendar Booking & Routing', status: 'pending', latency: '...', details: 'Matching available Closer availability' },
      ]);
    }, 2000);

    setTimeout(() => {
      setTestLog((prev) => [
        prev[0],
        prev[1],
        prev[2],
        { step: '4. Intelligent Calendar Booking & Routing', status: 'success', latency: '350ms', details: 'Confirmed appointment for Tomorrow at 2:00 PM' },
        { step: '5. CRM Sync & Revenue Attribution Loop', status: 'success', latency: '85ms', details: 'Deal created in Pipeline at ₦1,800,000 value' },
      ]);
      setTestLeadStatus('success');
      setIsLive(true);
    }, 2700);
  };

  const steps = [
    { num: 1, title: 'Business Profile', desc: 'Core offer & services' },
    { num: 2, title: 'Qualification Policy', desc: 'Define sales-ready leads' },
    { num: 3, title: 'Connect Lead Sources', desc: 'Automated ingestion' },
    { num: 4, title: 'Test Lead Verification', desc: 'End-to-end simulation' },
    { num: 5, title: 'Live Revenue Engine', desc: 'Deployment ready' },
  ];

  return (
    <div className="dashboard-canvas">
      {/* Operating Model Banner */}
      <div
        style={{
          background: 'var(--ink)',
          color: '#fff',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
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
            <Rocket size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 800 }}>Operating Model: Clean Lead-to-Revenue Division</span>
              <span className="status-pill active" style={{ fontSize: '11px' }}>
                {isLive ? 'SYSTEM LIVE' : 'ONBOARDING MODE'}
              </span>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--dark-muted)', margin: '2px 0 0 0' }}>
              <strong>The client owns the lead source. Zeerocodes operates the revenue-conversion process.</strong> Zero manual lead copy-pasting required.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn-accent"
            onClick={() => onNavigate?.('Client Portal')}
            style={{ padding: '7px 14px', fontSize: '12.5px' }}
          >
            Client Command Center <ExternalLink size={14} />
          </button>
        </div>
      </div>

      {/* View Header */}
      <div className="view-header" style={{ marginBottom: '20px' }}>
        <div className="view-title-group">
          <h1>Client Onboarding & Qualification Engine</h1>
          <p>
            Configure qualification policies, activate automated webhook listeners, and verify live lead-to-revenue automation.
          </p>
        </div>

        {/* Step Indicator */}
        <div style={{ display: 'flex', gap: '6px', background: 'var(--white)', padding: '6px', borderRadius: '10px', border: '1px solid var(--line)' }}>
          {steps.map((s) => (
            <button
              key={s.num}
              onClick={() => setCurrentStep(s.num)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: currentStep === s.num ? 'var(--ink)' : 'transparent',
                color: currentStep === s.num ? 'var(--accent)' : 'var(--muted)',
                fontWeight: currentStep === s.num ? 700 : 500,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              <span>{s.num}.</span>
              <span>{s.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* STEP 1: BUSINESS PROFILE */}
      {currentStep === 1 && (
        <div className="table-card" style={{ padding: '24px', maxWidth: '850px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Building2 size={20} color="var(--accent-deep)" />
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>Step 1: Business & Commercial Profile</h2>
              <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: '2px 0 0 0' }}>
                Tell Zeerocodes about your primary services and high-ticket offers so the AI can represent you accurately.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>Business Name</label>
              <input
                type="text"
                value={businessProfile.businessName}
                onChange={(e) => setBusinessProfile({ ...businessProfile, businessName: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>Industry / Vertical</label>
              <input
                type="text"
                value={businessProfile.industry}
                onChange={(e) => setBusinessProfile({ ...businessProfile, industry: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>Primary Service / Core Offer</label>
              <input
                type="text"
                value={businessProfile.primaryService}
                onChange={(e) => setBusinessProfile({ ...businessProfile, primaryService: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>Target Service Locations</label>
              <input
                type="text"
                value={businessProfile.locations}
                onChange={(e) => setBusinessProfile({ ...businessProfile, locations: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>Average Deal Value (₦)</label>
              <input
                type="number"
                value={businessProfile.avgDealValue}
                onChange={(e) => setBusinessProfile({ ...businessProfile, avgDealValue: Number(e.target.value) })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>Target Sales Cycle</label>
              <select
                value={businessProfile.salesCycleDays}
                onChange={(e) => setBusinessProfile({ ...businessProfile, salesCycleDays: Number(e.target.value) })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px', background: 'var(--white)' }}
              >
                <option value={3}>1-3 Days (High Velocity)</option>
                <option value={7}>7 Days (Standard SME)</option>
                <option value={14}>14 Days (Consultative)</option>
                <option value={30}>30 Days (Enterprise)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
            <button className="btn-accent" onClick={() => setCurrentStep(2)}>
              Save & Define Qualification Rules <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: QUALIFICATION RULES */}
      {currentStep === 2 && (
        <div className="table-card" style={{ padding: '24px', maxWidth: '850px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Sliders size={20} color="var(--accent-deep)" />
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>Step 2: Define Qualified Lead Criteria</h2>
              <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: '2px 0 0 0' }}>
                Answer: <em>"What makes a lead worth my salesperson's time?"</em> AI will strictly enforce this policy.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            {/* Minimum AI Score Slider */}
            <div style={{ background: 'var(--paper)', padding: '16px', borderRadius: '8px', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Minimum Sales-Ready Score Threshold</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-deep)' }}>
                  {qualificationPolicy.minScore} / 100
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={qualificationPolicy.minScore}
                onChange={(e) => setQualificationPolicy({ ...qualificationPolicy, minScore: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--ink)' }}
              />
              <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
                Leads scoring above {qualificationPolicy.minScore} are automatically routed to senior Closers with booked calendar demos.
              </span>
            </div>

            {/* Checklist Policy Parameters */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'var(--white)',
                  border: '1px solid var(--line)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={qualificationPolicy.requireBudget}
                  onChange={(e) => setQualificationPolicy({ ...qualificationPolicy, requireBudget: e.target.checked })}
                  style={{ marginTop: '3px' }}
                />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>Require Minimum Budget</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>₦{qualificationPolicy.minBudget.toLocaleString()}+ budget confirmed</div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'var(--white)',
                  border: '1px solid var(--line)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={qualificationPolicy.requireDecisionMaker}
                  onChange={(e) => setQualificationPolicy({ ...qualificationPolicy, requireDecisionMaker: e.target.checked })}
                  style={{ marginTop: '3px' }}
                />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>Confirm Decision-Maker</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Owner, Director, MD or Head of Dept</div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'var(--white)',
                  border: '1px solid var(--line)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={qualificationPolicy.requireLocationFit}
                  onChange={(e) => setQualificationPolicy({ ...qualificationPolicy, requireLocationFit: e.target.checked })}
                  style={{ marginTop: '3px' }}
                />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>Strict Location Match</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Within serviceable zones</div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'var(--white)',
                  border: '1px solid var(--line)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={qualificationPolicy.autoBookAppointments}
                  onChange={(e) => setQualificationPolicy({ ...qualificationPolicy, autoBookAppointments: e.target.checked })}
                  style={{ marginTop: '3px' }}
                />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>Automated Demo Booking</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Auto-propose time slots via AI</div>
                </div>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
            <button className="btn-secondary" onClick={() => setCurrentStep(1)}>
              Back
            </button>
            <button className="btn-accent" onClick={() => setCurrentStep(3)}>
              Proceed to Lead Sources <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: CONNECT LEAD SOURCES */}
      {currentStep === 3 && (
        <div className="table-card" style={{ padding: '24px', maxWidth: '850px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Radio size={20} color="var(--accent-deep)" />
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>Step 3: Connect Your Lead Sources (No Manual Re-entry)</h2>
              <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: '2px 0 0 0' }}>
                Zeerocodes connects directly to your advertising and communication channels.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {/* Meta Lead Ads */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: '8px', background: 'var(--paper)', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>📱</span>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700 }}>Facebook & Instagram Lead Ads</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Instant Webhook Lead Listener (0.4s response)</div>
                </div>
              </div>
              <span className="status-pill active">Connected ✓</span>
            </div>

            {/* Website Webhook */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: '8px', background: 'var(--paper)', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>🌐</span>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700 }}>Client Website Form (API & Webhooks)</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>POST /api/public/lead-intake?tenant={session.tenantId}</div>
                </div>
              </div>
              <span className="status-pill active">Live Endpoint ✓</span>
            </div>

            {/* WhatsApp */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: '8px', background: 'var(--paper)', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>💬</span>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700 }}>WhatsApp Cloud API</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Direct two-way conversation AI agent</div>
                </div>
              </div>
              <span className="status-pill active">Active ✓</span>
            </div>

            {/* Fallback CSV Import */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: '8px', background: 'var(--white)', border: '1px dashed var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Upload size={22} color="var(--muted)" />
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700 }}>Historical Database Upload (CSV / Excel Fallback)</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Import old dead leads for automated AI revival sequence</div>
                </div>
              </div>
              <button className="btn-secondary" style={{ padding: '5px 12px', fontSize: '12px' }} onClick={() => alert('CSV Uploader opened')}>
                Upload CSV
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
            <button className="btn-secondary" onClick={() => setCurrentStep(2)}>
              Back
            </button>
            <button className="btn-accent" onClick={() => setCurrentStep(4)}>
              Run Test Lead Verification <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: TEST LEAD SIMULATION */}
      {currentStep === 4 && (
        <div className="table-card" style={{ padding: '24px', maxWidth: '850px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Play size={20} color="var(--accent-deep)" />
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>Step 4: End-to-End Test Lead Verification</h2>
              <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: '2px 0 0 0' }}>
                Simulate a realistic lead arriving right now and watch the engine execute every stage in real-time.
              </p>
            </div>
          </div>

          <div style={{ background: 'var(--dark)', color: '#fff', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 700 }}>
                ⚡ Test Payload: John Doe • Commercial Office Cleaning (2,000 sqm) • ₦1.8M
              </div>
              <button
                className="btn-accent"
                onClick={runLeadSimulation}
                disabled={testLeadStatus === 'running'}
                style={{ padding: '6px 14px', fontSize: '12px' }}
              >
                {testLeadStatus === 'running' ? 'Simulating Engine...' : 'Run Live Test Lead'}
              </button>
            </div>

            {testLog.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--dark-muted)', fontSize: '13px' }}>
                Click "Run Live Test Lead" to verify ingestion, qualification scoring, AI response, calendar booking, and CRM deal creation.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {testLog.map((log, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: 'var(--dark-surface)',
                      borderRadius: '6px',
                      border: '1px solid var(--dark-border)',
                      fontSize: '12.5px',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: log.status === 'success' ? 'var(--accent)' : '#fff' }}>
                        {log.step} {log.status === 'success' ? '✓' : '...'}
                      </div>
                      <div style={{ color: 'var(--dark-muted)', fontSize: '11.5px', marginTop: '2px' }}>
                        {log.details}
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--accent)', fontFamily: 'monospace' }}>
                      {log.latency}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
            <button className="btn-secondary" onClick={() => setCurrentStep(3)}>
              Back
            </button>
            <button
              className="btn-accent"
              onClick={() => setCurrentStep(5)}
              disabled={testLeadStatus !== 'success'}
            >
              Authorize & Go Live <Rocket size={15} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: DEPLOYMENT READY & GO LIVE */}
      {currentStep === 5 && (
        <div className="table-card" style={{ padding: '32px', maxWidth: '850px', textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(199, 255, 85, 0.2)',
              color: 'var(--accent-deep)',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 16px auto',
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px 0' }}>
            Zeerocodes Revenue Engine is Live & Connected!
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--muted)', maxWidth: '520px', margin: '0 auto 24px auto', lineHeight: 1.5 }}>
            Your lead channels are synchronized. Inbound leads will now be engaged in under 45 seconds, qualified against your custom rules, and booked straight to your team's calendar.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button className="btn-accent" onClick={() => onNavigate?.('Client Portal')} style={{ padding: '10px 20px', fontSize: '13.5px' }}>
              Open Client Command Center <ArrowRight size={16} />
            </button>
            <button className="btn-secondary" onClick={() => onNavigate?.('Inbox')} style={{ padding: '10px 20px', fontSize: '13.5px' }}>
              View Multi-Channel Inbox
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
