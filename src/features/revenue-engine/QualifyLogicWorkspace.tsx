import { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Brain,
  Building2,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Cpu,
  Edit3,
  ExternalLink,
  Flame,
  Globe,
  GraduationCap,
  HelpCircle,
  Home,
  Laptop,
  Layers,
  Play,
  Plus,
  RefreshCw,
  Save,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Target,
  UserCheck,
  Zap,
} from 'lucide-react';
import type { UserSession } from '../auth/AuthModal';

interface QualifyLogicWorkspaceProps {
  session?: UserSession;
  onNavigate?: (tab: string) => void;
}

const INDUSTRY_PRESETS = {
  saas: {
    id: 'saas',
    name: 'SaaS / Tech',
    icon: Laptop,
    prompt: `Prioritize B2B Tech founders and VP Engineering with 20+ employees. Score 90+ if they mention annual software budget > ₦5M or need integration within 14 days. Filter out single-user free plan requests.`,
    minBudget: '₦2,000,000',
    keyFactors: ['20+ Team Size', 'Cloud Infra Requirement', 'VP/Founder Title'],
  },
  realestate: {
    id: 'realestate',
    name: 'Real Estate',
    icon: Building2,
    prompt: `Prioritize Real Estate developers & property investors in Lagos (Ikoyi, Victoria Island, Lekki). Score 85+ if they mention ₦10M+ project budget or 'immediate' rollout. Filter out anyone asking for 'free' advice.`,
    minBudget: '₦10,000,000',
    keyFactors: ['Lagos Prime Zones', 'Commercial / Multi-Unit', 'Immediate Capital'],
  },
  homeservices: {
    id: 'homeservices',
    name: 'Home Services',
    icon: Home,
    prompt: `Prioritize Commercial cleaning & facility management contracts. Score 80+ if project scope exceeds 1,500 sqm and requires recurring weekly service. Filter out one-off residential queries under ₦150k.`,
    minBudget: '₦500,000',
    keyFactors: ['Commercial Property', 'Recurring Retainer', 'Decision Maker Confirmed'],
  },
  education: {
    id: 'education',
    name: 'Education',
    icon: GraduationCap,
    prompt: `Prioritize private universities and accredited K-12 school boards looking for enterprise automation. Score 85+ for 500+ student enrollment. Filter out individual student homework questions.`,
    minBudget: '₦1,500,000',
    keyFactors: ['Institution Head / Bursar', '500+ Students', 'Term Deployment'],
  },
};

export default function QualifyLogicWorkspace({ session, onNavigate }: QualifyLogicWorkspaceProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<keyof typeof INDUSTRY_PRESETS>('realestate');
  const [logicText, setLogicText] = useState(INDUSTRY_PRESETS.realestate.prompt);
  const [minBudgetInput, setMinBudgetInput] = useState('500000');
  const [requireDecisionMaker, setRequireDecisionMaker] = useState(true);
  const [requireLocationMatch, setRequireLocationMatch] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const handleSelectPreset = (key: keyof typeof INDUSTRY_PRESETS) => {
    setSelectedIndustry(key);
    setLogicText(INDUSTRY_PRESETS[key].prompt);
    setIsSaved(false);
  };

  const handleSaveLogic = () => {
    setIsSaved(true);
    setTimeout(() => {
      alert('🚀 Qualification Rules & AI Brain successfully deployed across all live channels (Meta Ads, Website Webhook, WhatsApp)!');
    }, 100);
  };

  const handleRunSimulator = () => {
    setIsSimulating(true);
    setTestResult(null);
    setTimeout(() => {
      setIsSimulating(false);
      setTestResult({
        leadName: 'Engr. Babatunde Jinadu (Prime Construct Ltd)',
        extractedScore: 92,
        tier: 'UNICORN',
        rationale: 'Decision Maker confirmed (MD). Budget ₦2.5M matches Lagos real estate criteria. Immediate 7-day timeline.',
        recommendedAction: 'Direct Closer Handoff + Auto-propose Demo Slot',
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
            QUALIFY RULES <span style={{ color: '#ff5722' }}>OVERVIEW</span>
          </h1>
          <p style={{ fontSize: '12.5px', color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0 }}>
            CONFIGURE THE AI BRAIN. TELL THE AGENT EXACTLY WHICH PROSPECTS ARE "GOLD STANDARD" AND WHICH SHOULD BE FILTERED OUT.
          </p>
        </div>

        <div className="view-actions">
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

      {/* Industry Quick Preset Tabs */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '22px' }}>
        {(Object.keys(INDUSTRY_PRESETS) as (keyof typeof INDUSTRY_PRESETS)[]).map((key) => {
          const item = INDUSTRY_PRESETS[key];
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
                padding: '9px 18px',
                borderRadius: '8px',
                border: active ? '1px solid #ff5722' : '1px solid var(--line)',
                background: active ? '#ff5722' : 'var(--white)',
                color: active ? '#fff' : 'var(--ink)',
                fontWeight: 700,
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: active ? '0 2px 8px rgba(255, 87, 34, 0.25)' : 'var(--shadow-sm)',
              }}
            >
              <Icon size={15} />
              <span>{item.name.toUpperCase()}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Logic Editor + Guidelines Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '20px', marginBottom: '28px' }}>
        {/* Left Panel: English Logic Editor */}
        <div className="table-card" style={{ padding: '22px', margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="#ff5722" />
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                ENGLISH LOGIC EDITOR
              </h3>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>Natural Language AI Prompt</span>
          </div>

          {/* Gold Standard Template Card */}
          <div style={{ background: 'var(--paper)', padding: '16px', borderRadius: '10px', border: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5722' }} />
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#ff5722', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                THE "GOLD STANDARD" TEMPLATE
              </span>
            </div>

            <textarea
              rows={4}
              value={logicText}
              onChange={(e) => {
                setLogicText(e.target.value);
                setIsSaved(false);
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                background: 'var(--white)',
                fontSize: '13px',
                lineHeight: 1.5,
                color: 'var(--ink)',
                resize: 'vertical',
                outline: 'none',
              }}
            />

            {/* Quick Rule Badges */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', background: '#dcfce7', color: '#166534', padding: '3px 9px', borderRadius: '4px', fontWeight: 700 }}>
                <Check size={12} /> INDUSTRY SPECIFICS
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', background: '#dcfce7', color: '#166534', padding: '3px 9px', borderRadius: '4px', fontWeight: 700 }}>
                <Check size={12} /> FINANCIAL THRESHOLDS
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', background: '#e0f2fe', color: '#0369a1', padding: '3px 9px', borderRadius: '4px', fontWeight: 700 }}>
                <Check size={12} /> DECISION MAKER KEYWORDS
              </span>
            </div>
          </div>

          {/* Interactive Logic Testing Sandbox */}
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 700 }}>Live Qualification Test Simulator</span>
              <button
                className="btn-secondary"
                onClick={handleRunSimulator}
                disabled={isSimulating}
                style={{ padding: '5px 12px', fontSize: '11.5px', fontWeight: 700 }}
              >
                <Play size={12} /> {isSimulating ? 'Evaluating...' : 'Test Rules on Sample Lead'}
              </button>
            </div>

            {testResult && (
              <div style={{ padding: '12px 14px', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: '12.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <strong>{testResult.leadName}</strong>
                  <span className="status-pill booked" style={{ background: '#16a34a', color: '#fff' }}>
                    SCORE {testResult.extractedScore}/100 ({testResult.tier})
                  </span>
                </div>
                <div style={{ color: '#15803d', fontSize: '12px', marginBottom: '4px' }}>
                  {testResult.rationale}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
                  <strong>Action:</strong> {testResult.recommendedAction}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Guidelines & Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="dark-panel" style={{ margin: 0, padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <ShieldCheck size={20} color="var(--accent)" />
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                GUIDELINES
              </h3>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--dark-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
              The AI uses these rules to generate the <strong>0-100 Score</strong>. Be specific about your deal-breakers.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <Target size={16} color="#ff5722" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div style={{ fontSize: '12.5px', color: 'var(--dark-text)' }}>
                  <strong>Mention specific industries you prefer:</strong> e.g. "B2B SaaS, Commercial Real Estate, FinTech".
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <Target size={16} color="#ff5722" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div style={{ fontSize: '12.5px', color: 'var(--dark-text)' }}>
                  <strong>Define minimum budget thresholds:</strong> e.g. "Filter out projects under ₦500k".
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <Target size={16} color="#ff5722" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div style={{ fontSize: '12.5px', color: 'var(--dark-text)' }}>
                  <strong>Identify decision-maker keywords:</strong> e.g. "MD, CEO, Founder, Director, Head of Dept".
                </div>
              </div>
            </div>
          </div>

          {/* AI Agent Status Card */}
          <div style={{ background: 'var(--dark-surface)', padding: '16px', borderRadius: '10px', border: '1px solid var(--dark-border)', color: '#fff' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#ff5722', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              AI AGENT STATUS
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>
              Monitoring 20 leads in real-time...
            </div>
            <div style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: '82%', height: '100%', background: '#ff5722', borderRadius: '3px' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: SCORING ARCHITECTURE (0-100) - Matches Screenshot 5 */}
      <div className="table-card" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255, 87, 34, 0.15)',
              color: '#ff5722',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Sliders size={16} />
          </div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 900, margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              SCORING ARCHITECTURE
            </h2>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
              HOW AI EVALUATES YOUR LEADS (0-100)
            </div>
          </div>
        </div>

        {/* 4-Tier Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          {/* UNICORN (90-100) */}
          <div style={{ background: 'var(--paper)', border: '1px solid #16a34a', borderRadius: '10px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                UNICORN
              </span>
              <Sparkles size={16} color="#16a34a" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--ink)' }}>90-100</div>
            <p style={{ fontSize: '11.5px', color: 'var(--muted)', margin: 0, lineHeight: 1.4, fontWeight: 600, textTransform: 'uppercase' }}>
              PERFECT MATCH. DECISION MAKER, HIGH BUDGET, AND IMMEDIATE NEED DETECTED.
            </p>
          </div>

          {/* QUALIFIED (70-89) */}
          <div style={{ background: 'var(--paper)', border: '1px solid #ea580c', borderRadius: '10px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, background: '#ffedd5', color: '#c2410c', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                QUALIFIED
              </span>
              <CheckCircle2 size={16} color="#ea580c" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--ink)' }}>70-89</div>
            <p style={{ fontSize: '11.5px', color: 'var(--muted)', margin: 0, lineHeight: 1.4, fontWeight: 600, textTransform: 'uppercase' }}>
              STRONG FIT. MEETS ALL CORE CRITERIA BUT MIGHT HAVE MINOR FRICTION POINTS.
            </p>
          </div>

          {/* REVIEW (40-69) */}
          <div style={{ background: 'var(--paper)', border: '1px solid #d97706', borderRadius: '10px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                REVIEW
              </span>
              <AlertTriangle size={16} color="#d97706" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--ink)' }}>40-69</div>
            <p style={{ fontSize: '11.5px', color: 'var(--muted)', margin: 0, lineHeight: 1.4, fontWeight: 600, textTransform: 'uppercase' }}>
              POTENTIAL FIT. MISSING SOME KEY DATA POINTS OR BELOW TARGET BUDGET.
            </p>
          </div>

          {/* FILTERED (0-39) */}
          <div style={{ background: 'var(--paper)', border: '1px solid #dc2626', borderRadius: '10px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                FILTERED
              </span>
              <ShieldAlert size={16} color="#dc2626" />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--ink)' }}>0-39</div>
            <p style={{ fontSize: '11.5px', color: 'var(--muted)', margin: 0, lineHeight: 1.4, fontWeight: 600, textTransform: 'uppercase' }}>
              POOR MATCH. WRONG INDUSTRY, NO AUTHORITY, OR SIGNIFICANTLY LOW BUDGET.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
