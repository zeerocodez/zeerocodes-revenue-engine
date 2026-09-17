import { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Brain,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Cpu,
  DollarSign,
  Edit3,
  ExternalLink,
  Flame,
  Globe,
  GraduationCap,
  HelpCircle,
  Home,
  Info,
  Laptop,
  Layers,
  PhoneCall,
  Play,
  Plus,
  RefreshCw,
  Save,
  Scale,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Stethoscope,
  Target,
  UserCheck,
  Zap,
} from 'lucide-react';
import type { UserSession } from '../auth/AuthModal';

interface QualifyLogicWorkspaceProps {
  session?: UserSession;
  onNavigate?: (tab: string) => void;
}

export interface ServiceVerticalPreset {
  id: string;
  name: string;
  category: string;
  icon: typeof Briefcase;
  prompt: string;
  minBudget: string;
  keyFactors: string[];
  qualifyingQuestions: string[];
  setterScriptHook: string;
}

export const SERVICE_VERTICAL_PRESETS: Record<string, ServiceVerticalPreset> = {
  consulting: {
    id: 'consulting',
    name: 'Management & Strategy Consulting',
    category: 'B2B Professional Services',
    icon: Briefcase,
    prompt: `Prioritize C-level executives (CEO, COO, CFO) or Managing Directors of companies with 25+ staff seeking operational restructuring, turnaround strategy, or market entry. Score 90+ if annual consulting engagement budget > ₦5,000,000 and timeline is within 30 days. Filter out individuals seeking free job advice or student projects.`,
    minBudget: '₦5,000,000',
    keyFactors: ['C-Level / MD Authority', '25+ Team Size', 'Immediate Strategy Need'],
    qualifyingQuestions: [
      'What is the primary operational or revenue bottleneck you need resolved?',
      'Are you the Managing Director or CFO authorizing external advisory?',
      'What budget range has been allocated for this engagement (e.g. ₦5M - ₦25M)?',
    ],
    setterScriptHook: '“Hello [Name], I reviewed your inquiry regarding executive restructuring for [Company]. Given your target rollout this quarter, our Lead Partner reserved 15 minutes to share our playbook.”',
  },
  tech_services: {
    id: 'tech_services',
    name: 'IT Services & Custom Software',
    category: 'Technology & Cloud',
    icon: Laptop,
    prompt: `Prioritize CTOs, Founders, and VP Engineering at high-growth businesses requiring bespoke web/mobile development, cloud migration, or system integration. Score 90+ if project budget is ₦3,000,000+ or recurring retainer ₦750k/mo, with a target sprint kick-off within 21 days. Filter out single-user MVP builders with no budget.`,
    minBudget: '₦3,000,000',
    keyFactors: ['Technical Decision Maker', 'Bespoke Scope', 'Funded / Cash-Flowing'],
    qualifyingQuestions: [
      'What core architecture or software stack is your team building or replacing?',
      'Do you have documented technical specifications or wireframes ready?',
      'Is your development timeline pegged for kick-off this month?',
    ],
    setterScriptHook: '“Hi [Name], our Solutions Architect inspected your technical requirements. We have a pre-built architecture framework that cuts your build time by 60%. Let’s review it today.”',
  },
  financial_advisory: {
    id: 'financial_advisory',
    name: 'Financial Advisory & Wealth Management',
    category: 'Finance & Corporate',
    icon: DollarSign,
    prompt: `Prioritize high-net-worth individuals (HNWIs) and corporate boards seeking M&A advisory, tax structuring, audit, or wealth preservation. Score 88+ if investable portfolio or transaction size exceeds ₦25,000,000. Filter out retail micro-loan or cryptocurrency inquiries.`,
    minBudget: '₦25,000,000',
    keyFactors: ['Accredited Investor / Corporate', '₦25M+ Liquidity / Deal Size', 'Formal Mandate Ready'],
    qualifyingQuestions: [
      'What is the estimated size of the asset portfolio or transaction under review?',
      'Are you seeking corporate tax optimization, capital raise, or wealth structuring?',
      'When does your board require the preliminary memorandum delivered?',
    ],
    setterScriptHook: '“Good day [Name], our Senior Partner in corporate advisory can walk you through our recent transaction case study for similar portfolios.”',
  },
  legal_advisory: {
    id: 'legal_advisory',
    name: 'Corporate Legal & Compliance',
    category: 'Legal Services',
    icon: Scale,
    prompt: `Prioritize commercial enterprises, tech startups, and multinational subsidiaries needing corporate governance, IP protection, cross-border contracts, or regulatory compliance. Score 85+ if retained legal advisory budget is ₦1.5M/mo+ or single retainer ₦5M+. Filter out pro-bono or personal domestic disputes.`,
    minBudget: '₦1,500,000/mo',
    keyFactors: ['Corporate Entity', 'Regulatory / M&A Scope', 'Retainer Commitment'],
    qualifyingQuestions: [
      'Is this an ongoing corporate retainer or a specific commercial transaction/dispute?',
      'Are you the General Counsel, Managing Partner, or CEO?',
      'Which regulatory jurisdictions does your business operate in?',
    ],
    setterScriptHook: '“Hello [Name], our Lead Corporate Counsel reviewed your compliance inquiry. We can schedule a confidential 20-minute briefing.”',
  },
  agency: {
    id: 'agency',
    name: 'High-Ticket Marketing & Growth Agency',
    category: 'Digital & Growth',
    icon: Zap,
    prompt: `Prioritize e-commerce, real estate, and B2B companies spending at least ₦1,500,000/mo on digital ad spend seeking full-funnel paid media, CRO, and revenue ops. Score 90+ if monthly marketing budget > ₦2M and sales team is ready for rapid lead volume. Filter out dropshippers or businesses with zero ad budget.`,
    minBudget: '₦2,000,000/mo',
    keyFactors: ['₦1.5M+ Monthly Ad Spend', 'Validated Product/Offer', 'Active Sales Team'],
    qualifyingQuestions: [
      'What is your average monthly paid acquisition spend on Meta / Google / LinkedIn?',
      'What is your current Customer Acquisition Cost (CAC) and target pipeline volume?',
      'Do you have a dedicated sales team ready to handle 300+ qualified leads/mo?',
    ],
    setterScriptHook: '“Hi [Name], we modeled your customer acquisition numbers. We can guarantee a 3.4x pipeline lift based on your current ad spend.”',
  },
  engineering_facilities: {
    id: 'engineering_facilities',
    name: 'Engineering & Commercial Facilities',
    category: 'Industrial & Real Estate',
    icon: Building2,
    prompt: `Prioritize commercial facility managers, developers, and corporate headquarters needing post-construction cleaning, MEP maintenance, or annual facility contracts over 1,500 sqm. Score 85+ if contract value exceeds ₦3,500,000. Filter out one-off residential requests under ₦200k.`,
    minBudget: '₦3,500,000',
    keyFactors: ['Commercial Multi-Unit / HQ', '1,500+ SQM Scope', 'Annual Contract Potential'],
    qualifyingQuestions: [
      'What is the total square footage and property classification of the facility?',
      'Are you seeking an annual facility maintenance contract or a one-off post-construction handover?',
      'Is the property inspection required within the next 7 business days?',
    ],
    setterScriptHook: '“Hello [Name], our Senior Operations Director can perform an on-site technical inspection in Lekki/VI this Thursday.”',
  },
  healthcare: {
    id: 'healthcare',
    name: 'Specialist Healthcare & Dental Clinics',
    category: 'Medical & Health Services',
    icon: Stethoscope,
    prompt: `Prioritize medical directors, dental surgery owners, and private clinic administrators looking for automated patient booking, high-ticket surgical triage, and private care concierge. Score 85+ if clinic handles 100+ private patients/mo with procedure values ₦500k+. Filter out emergency trauma requests.`,
    minBudget: '₦1,000,000',
    keyFactors: ['Private Clinic / Hospital', 'High-Ticket Procedure Focus', 'Dedicated Reception Team'],
    qualifyingQuestions: [
      'What are your primary elective or specialist procedures (e.g. Dental, Aesthetics, Diagnostics)?',
      'How many patient inquiries does your practice receive each week?',
      'Do you require bi-directional Electronic Health Record (EHR) calendar synchronization?',
    ],
    setterScriptHook: '“Dr. [Name], our Healthcare Concierge Engine automated 140+ private patient consultations last month for clinics in your area.”',
  },
  custom: {
    id: 'custom',
    name: 'Custom Service Business Vertical',
    category: 'Custom Industry Schema',
    icon: Sliders,
    prompt: `Specify your custom service qualification criteria here in plain English. State your minimum budget threshold, required job titles, location filters, and red flags. The AI will enforce these exact rules across all inbound WhatsApp, Ads, and Webhook leads.`,
    minBudget: 'Custom',
    keyFactors: ['Custom Threshold', 'Custom DM Keywords', 'Custom Objection Filters'],
    qualifyingQuestions: [
      'What is your primary commercial offering and target customer?',
      'What is the minimum transaction value or monthly retainer acceptable?',
      'What specific disqualifying red flags should the AI filter immediately?',
    ],
    setterScriptHook: '“Hello [Name], I noticed your requirement for [Custom Service]. Let’s explore your deployment timeline.”',
  },
};

export default function QualifyLogicWorkspace({ session, onNavigate }: QualifyLogicWorkspaceProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('consulting');
  const [logicText, setLogicText] = useState(SERVICE_VERTICAL_PRESETS.consulting.prompt);
  const [minBudgetInput, setMinBudgetInput] = useState('2000000');
  const [requireDecisionMaker, setRequireDecisionMaker] = useState(true);
  const [requireLocationMatch, setRequireLocationMatch] = useState(true);
  const [requireTimelineMatch, setRequireTimelineMatch] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [activeSubTab, setActiveSubTab] = useState<'editor' | 'rubric' | 'guide'>('editor');

  const currentPreset = SERVICE_VERTICAL_PRESETS[selectedIndustry] || SERVICE_VERTICAL_PRESETS.consulting;

  const handleSelectPreset = (key: string) => {
    setSelectedIndustry(key);
    setLogicText(SERVICE_VERTICAL_PRESETS[key].prompt);
    setIsSaved(false);
  };

  const handleSaveLogic = () => {
    setIsSaved(true);
    setTimeout(() => {
      alert('🚀 Qualification Rules & AI Brain successfully deployed across all live channels (Meta Ads, Website Webhook, WhatsApp, Inbound Calls)!');
    }, 100);
  };

  const handleRunSimulator = () => {
    setIsSimulating(true);
    setTestResult(null);
    setTimeout(() => {
      setIsSimulating(false);
      setTestResult({
        leadName: 'Engr. Babatunde Jinadu (Prime Construct Ltd)',
        serviceCategory: currentPreset.name,
        extractedScore: 92,
        tier: 'UNICORN',
        rationale: 'Decision Maker confirmed (MD). Stated budget ₦5.5M meets threshold. Timeline: Immediate 14 days.',
        extractedAnswers: [
          { q: 'Authority', a: 'Managing Director / Sole Decision Maker', pass: true },
          { q: 'Budget Fit', a: '₦5,500,000 allocated for Q3 rollout', pass: true },
          { q: 'Timeline', a: 'Kickoff required within 14 business days', pass: true },
        ],
        generatedScript: currentPreset.setterScriptHook.replace('[Name]', 'Engr. Babatunde').replace('[Company]', 'Prime Construct'),
        recommendedAction: 'Direct Closer Handoff + Auto-propose Google Meet Slot',
      });
    }, 800);
  };

  return (
    <div className="dashboard-canvas">
      {/* Header with Title and Deploy Action */}
      <div className="view-header" style={{ marginBottom: '20px' }}>
        <div className="view-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="role-badge superadmin" style={{ background: '#ff5722', color: '#fff' }}>08 QUALIFY LOGIC</span>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Tenant: <strong>{session?.tenantName || 'Zeerocodes Enterprise'}</strong></span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
            AI QUALIFICATION <span style={{ color: '#ff5722' }}>LOGIC & BRAIN</span>
          </h1>
          <p style={{ fontSize: '12.5px', color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0 }}>
            TAILORED FOR HIGH-TICKET SERVICE BUSINESSES. DEFINE WHO GETS IMMEDIATE CALLS VS WHO GETS NURTURED OR FILTERED.
          </p>
        </div>

        <div className="view-actions" style={{ display: 'flex', gap: '10px' }}>
          <button
            className={`btn-secondary ${activeSubTab === 'guide' ? 'active' : ''}`}
            onClick={() => setActiveSubTab(activeSubTab === 'guide' ? 'editor' : 'guide')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', padding: '9px 15px' }}
          >
            <Info size={15} color="var(--accent-deep)" />
            <span>How AI Qualification Works</span>
          </button>

          <button
            className="btn-accent"
            onClick={handleSaveLogic}
            style={{
              background: '#ff5722',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 800,
              letterSpacing: '0.04em',
              boxShadow: '0 4px 14px rgba(255, 87, 34, 0.35)',
            }}
          >
            <Save size={16} /> SAVE & DEPLOY LOGIC
          </button>
        </div>
      </div>

      {/* Educational Guide Callout for Clients */}
      {activeSubTab === 'guide' && (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--accent)', borderRadius: '12px', padding: '20px', marginBottom: '24px', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={20} color="#ff5722" />
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>How the Zeerocodes 45-Second AI Qualification Works</h3>
            </div>
            <button onClick={() => setActiveSubTab('editor')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--muted)' }}>✕ Close Guide</button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginTop: '14px' }}>
            <div style={{ background: 'var(--bg)', padding: '14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 800, fontSize: '13px', marginBottom: '6px' }}>
                <CheckCircle2 size={16} /> 1. Instant Strike (&lt;45s)
              </div>
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0, lineHeight: 1.4 }}>
                The moment a lead opts in from Meta Ads, Google, or Web forms, our AI sends a personalized WhatsApp message & triggers an automated outbound voice check within 45 seconds.
              </p>
            </div>

            <div style={{ background: 'var(--bg)', padding: '14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3b82f6', fontWeight: 800, fontSize: '13px', marginBottom: '6px' }}>
                <Brain size={16} /> 2. 4-Tier Scoring Engine
              </div>
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0, lineHeight: 1.4 }}>
                AI analyzes Budget, Decision-Maker Authority, Need, and Timeline. Leads scoring <strong>90-100 (Unicorn)</strong> or <strong>70-89 (Qualified)</strong> get immediate demo proposals.
              </p>
            </div>

            <div style={{ background: 'var(--bg)', padding: '14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontWeight: 800, fontSize: '13px', marginBottom: '6px' }}>
                <Bot size={16} /> 3. Human Setter Handoff
              </div>
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0, lineHeight: 1.4 }}>
                If a lead asks complex custom questions or scores in the <strong>40-69 (Review)</strong> bracket, the AI creates an Executive Brief & custom call script and hands off to your setter.
              </p>
            </div>

            <div style={{ background: 'var(--bg)', padding: '14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontWeight: 800, fontSize: '13px', marginBottom: '6px' }}>
                <ShieldCheck size={16} /> 4. Low-Intent Auto-Filter
              </div>
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0, lineHeight: 1.4 }}>
                Leads below score 40 (free seekers, unverified numbers, out-of-scope) are gently placed into low-touch email nurture, protecting your sales team’s valuable time.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Industry Vertical Tabs for Service-Based Businesses */}
      <div style={{ marginBottom: '22px' }}>
        <div style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '8px' }}>
          Select High-Ticket Service Vertical Preset:
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {Object.keys(SERVICE_VERTICAL_PRESETS).map((key) => {
            const item = SERVICE_VERTICAL_PRESETS[key];
            const Icon = item.icon;
            const active = selectedIndustry === key;
            return (
              <button
                key={key}
                onClick={() => handleSelectPreset(key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: active ? '1px solid #ff5722' : '1px solid var(--line)',
                  background: active ? '#ff5722' : 'var(--white)',
                  color: active ? '#fff' : 'var(--ink)',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: active ? '0 2px 8px rgba(255, 87, 34, 0.25)' : 'var(--shadow-sm)',
                }}
              >
                <Icon size={14} />
                <span>{item.name.toUpperCase()}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '22px' }}>
        {/* Left Column: Natural Language Prompt Editor & Dynamic Qualifiers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Natural Language Prompt Card */}
          <div className="card" style={{ padding: '22px', border: '1px solid var(--line)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="#ff5722" />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, textTransform: 'uppercase' }}>
                  English Logic Editor ({currentPreset.name})
                </h3>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>Natural Language AI Prompt</span>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 800, color: '#ff5722', textTransform: 'uppercase', marginBottom: '6px' }}>
                • The "Gold Standard" Service Client Rubric
              </label>
              <textarea
                value={logicText}
                onChange={(e) => {
                  setLogicText(e.target.value);
                  setIsSaved(false);
                }}
                rows={5}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--line)',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  lineHeight: 1.5,
                  color: 'var(--ink)',
                  background: 'var(--bg)',
                  resize: 'vertical',
                }}
                placeholder="Describe your ideal qualified service client in plain English..."
              />
            </div>

            {/* Key Qualifier Tags */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
              {currentPreset.keyFactors.map((factor, idx) => (
                <span
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#059669',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                  }}
                >
                  <Check size={12} /> {factor}
                </span>
              ))}
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  background: 'rgba(255, 87, 34, 0.1)',
                  color: '#ff5722',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 87, 34, 0.25)',
                }}
              >
                Min Target: {currentPreset.minBudget}
              </span>
            </div>
          </div>

          {/* AI Qualifying Questions & Discovery Tree */}
          <div className="card" style={{ padding: '20px', border: '1px solid var(--line)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Bot size={17} color="var(--accent-deep)" />
              <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: 800 }}>Automated Discovery Questions for WhatsApp & Voice</h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '0 0 12px 0' }}>
              These high-intent discovery prompts are asked by the AI during the first 45-second conversation to verify qualification score:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {currentPreset.qualifyingQuestions.map((question, qIdx) => (
                <div
                  key={qIdx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    background: 'var(--bg)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    fontSize: '12.5px',
                  }}
                >
                  <span style={{ fontWeight: 800, color: '#ff5722', minWidth: '18px' }}>Q{qIdx + 1}:</span>
                  <span style={{ color: 'var(--ink)' }}>{question}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hard Guardrails & Filters */}
          <div className="card" style={{ padding: '20px', border: '1px solid var(--line)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <ShieldCheck size={17} color="#10b981" />
              <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: 800 }}>Deterministic Hard Filters & Safety Guardrails</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={requireDecisionMaker}
                  onChange={(e) => setRequireDecisionMaker(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#ff5722' }}
                />
                Require C-Level / MD Authority
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={requireTimelineMatch}
                  onChange={(e) => setRequireTimelineMatch(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#ff5722' }}
                />
                Require Stated Timeline (&lt;45 days)
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Qualification Simulator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="card" style={{ padding: '22px', border: '1px solid var(--line)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Play size={17} color="#ff5722" />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>Live Qualification Simulator</h3>
              </div>
              <button
                onClick={handleRunSimulator}
                disabled={isSimulating}
                className="btn-accent"
                style={{ padding: '6px 14px', fontSize: '12px', background: '#ff5722', color: '#fff', border: 'none' }}
              >
                {isSimulating ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} />}
                <span>{isSimulating ? 'Evaluating...' : 'Simulate Prospect'}</span>
              </button>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '0 0 14px 0' }}>
              Test your logic rules against a synthetic high-ticket service lead in real-time.
            </p>

            {testResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Score Pill Card */}
                <div
                  style={{
                    background: testResult.extractedScore >= 90 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 87, 34, 0.1)',
                    border: `1px solid ${testResult.extractedScore >= 90 ? '#10b981' : '#ff5722'}`,
                    padding: '14px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)' }}>
                      AI Verdict & Tier
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: testResult.extractedScore >= 90 ? '#059669' : '#ff5722' }}>
                      {testResult.tier} ({testResult.extractedScore}/100)
                    </div>
                  </div>
                  <span className="role-badge superadmin" style={{ background: testResult.extractedScore >= 90 ? '#10b981' : '#ff5722', color: '#fff' }}>
                    READY FOR CLOSER
                  </span>
                </div>

                {/* Extracted Qualifier Breakdown */}
                <div style={{ background: 'var(--bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px' }}>
                    Extracted Criteria:
                  </div>
                  {testResult.extractedAnswers?.map((item: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--muted)' }}>{item.q}:</span>
                      <strong style={{ color: item.pass ? '#059669' : '#ef4444' }}>{item.a}</strong>
                    </div>
                  ))}
                </div>

                {/* AI Generated Setter Follow-up Script */}
                <div style={{ background: 'rgba(255, 87, 34, 0.05)', padding: '12px', borderRadius: '8px', border: '1px dashed #ff5722' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#ff5722', marginBottom: '4px' }}>
                    AI Generated Setter Script Hook:
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--ink)', margin: 0, fontStyle: 'italic', lineHeight: 1.4 }}>
                    {testResult.generatedScript}
                  </p>
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: 'var(--bg)',
                  padding: '24px',
                  borderRadius: '8px',
                  border: '1px dashed var(--line)',
                  textAlign: 'center',
                  color: 'var(--muted)',
                  fontSize: '12.5px',
                }}
              >
                Click "Simulate Prospect" to run an automated 45-second test triage.
              </div>
            )}
          </div>

          {/* 4 Tier Reference Card */}
          <div className="card" style={{ padding: '20px', border: '1px solid var(--line)', borderRadius: '12px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '13.5px', fontWeight: 800 }}>Qualification Scoring Matrix</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px' }}>
                <strong style={{ color: '#059669' }}>UNICORN (90-100)</strong>
                <span>Direct Calendar Booking + Immediate SMS/Voice Alert</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px' }}>
                <strong style={{ color: '#2563eb' }}>QUALIFIED (70-89)</strong>
                <span>AI WhatsApp Propose Demo + Closer Priority</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '6px' }}>
                <strong style={{ color: '#d97706' }}>REVIEW (40-69)</strong>
                <span>Assigned to Human Setter Queue with AI Script</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>
                <strong style={{ color: '#dc2626' }}>FILTERED (0-39)</strong>
                <span>Automated Nurture Sequence (No Sales Rep Time)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
