import { useState, useEffect } from 'react';
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
  MessageSquare,
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
  Trash2,
  UserCheck,
  X,
  Zap,
} from 'lucide-react';
import type { UserSession } from '../auth/AuthModal';
import {
  type QualificationCriterion,
  type QualificationPolicyConfig,
  getTenantQualificationPolicy,
  saveTenantQualificationPolicy,
  INDUSTRY_CRITERIA_PRESETS,
  DEFAULT_QUALIFICATION_CRITERIA,
} from '../../domain/qualification-criteria';

interface QualifyLogicWorkspaceProps {
  session?: UserSession;
  onNavigate?: (tab: string) => void;
}

export default function QualifyLogicWorkspace({ session, onNavigate }: QualifyLogicWorkspaceProps) {
  const tenantId = session?.tenantId || 'new-business-tenant';
  const tenantDisplayName = session?.tenantName || session?.userName || 'Your Organization';

  // Load tenant qualification policy config
  const [policyConfig, setPolicyConfig] = useState<QualificationPolicyConfig>(() =>
    getTenantQualificationPolicy(tenantId)
  );
  const [criteria, setCriteria] = useState<QualificationCriterion[]>(() => policyConfig.criteria);
  const [minScore, setMinScore] = useState<number>(() => policyConfig.minScore || 75);
  const [selectedIndustry, setSelectedIndustry] = useState<string>(() => policyConfig.selectedIndustryPreset || 'consulting');
  const [autoBookAppointments, setAutoBookAppointments] = useState<boolean>(() => policyConfig.autoBookAppointments ?? true);

  // Criteria Add/Edit Modal
  const [editingCriterion, setEditingCriterion] = useState<QualificationCriterion | null>(null);
  const [isAddingCriterion, setIsAddingCriterion] = useState<boolean>(false);
  const [critForm, setCritForm] = useState({
    name: '',
    description: '',
    qualifyingQuestion: '',
    weight: 20,
    category: 'custom' as QualificationCriterion['category'],
    thresholdValue: '',
  });

  const [isSaved, setIsSaved] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [activeSubTab, setActiveSubTab] = useState<'editor' | 'rubric' | 'guide'>('editor');

  // Simulator Inputs
  const [simLead, setSimLead] = useState({
    name: 'Engr. Babatunde Jinadu (Prime Construct Ltd)',
    dealValue: '5500000',
    title: 'Managing Director',
    timeline: 'Immediate (14 days)',
    notes: 'Looking for full operational restructuring and executive revenue ops.',
  });

  // Save policy on changes
  useEffect(() => {
    const updatedPolicy: QualificationPolicyConfig = {
      minScore,
      criteria,
      autoBookAppointments,
      selectedIndustryPreset: selectedIndustry,
    };
    setPolicyConfig(updatedPolicy);
    saveTenantQualificationPolicy(tenantId, updatedPolicy);
  }, [minScore, criteria, autoBookAppointments, selectedIndustry, tenantId]);

  const handleToggleCriterion = (id: string) => {
    setCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
    setIsSaved(false);
  };

  const handleDeleteCriterion = (id: string) => {
    setCriteria((prev) => prev.filter((c) => c.id !== id));
    setIsSaved(false);
  };

  const handleOpenEditCriterion = (criterion: QualificationCriterion) => {
    setEditingCriterion(criterion);
    setCritForm({
      name: criterion.name,
      description: criterion.description,
      qualifyingQuestion: criterion.qualifyingQuestion,
      weight: criterion.weight,
      category: criterion.category,
      thresholdValue: String(criterion.thresholdValue || ''),
    });
  };

  const handleOpenAddCriterion = () => {
    setIsAddingCriterion(true);
    setCritForm({
      name: '',
      description: '',
      qualifyingQuestion: '',
      weight: 20,
      category: 'custom',
      thresholdValue: '',
    });
  };

  const handleSaveCriterionForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!critForm.name.trim()) return;

    if (editingCriterion) {
      setCriteria((prev) =>
        prev.map((c) =>
          c.id === editingCriterion.id
            ? {
                ...c,
                name: critForm.name,
                description: critForm.description,
                qualifyingQuestion: critForm.qualifyingQuestion,
                weight: Number(critForm.weight || 20),
                category: critForm.category,
                thresholdValue: critForm.thresholdValue,
              }
            : c
        )
      );
      setEditingCriterion(null);
    } else {
      const newCrit: QualificationCriterion = {
        id: `crit_custom_${Date.now()}`,
        name: critForm.name,
        description: critForm.description || critForm.name,
        enabled: true,
        weight: Number(critForm.weight || 20),
        category: critForm.category,
        thresholdValue: critForm.thresholdValue || 'Custom Requirement',
        qualifyingQuestion: critForm.qualifyingQuestion || `Can you confirm details regarding ${critForm.name}?`,
      };
      setCriteria((prev) => [...prev, newCrit]);
      setIsAddingCriterion(false);
    }
    setIsSaved(false);
  };

  const handleSelectPreset = (key: string) => {
    setSelectedIndustry(key);
    const preset = INDUSTRY_CRITERIA_PRESETS[key];
    if (preset) {
      setCriteria(preset.criteria);
    } else if (key === 'default') {
      setCriteria(DEFAULT_QUALIFICATION_CRITERIA);
    }
    setIsSaved(false);
  };

  const handleSaveLogic = () => {
    const updatedPolicy: QualificationPolicyConfig = {
      minScore,
      criteria,
      autoBookAppointments,
      selectedIndustryPreset: selectedIndustry,
    };
    saveTenantQualificationPolicy(tenantId, updatedPolicy);
    setIsSaved(true);
    setTimeout(() => {
      alert(`🚀 Qualification Rules & AI Brain successfully saved & deployed for ${tenantDisplayName}! Active on all inbound channels.`);
    }, 100);
  };

  const handleRunSimulator = () => {
    setIsSimulating(true);
    setTestResult(null);

    setTimeout(() => {
      setIsSimulating(false);
      const activeCriteria = criteria.filter((c) => c.enabled);
      const totalPossibleWeight = activeCriteria.reduce((sum, c) => sum + c.weight, 0);

      // Simulate passing active criteria
      let calculatedScore = 0;
      const extractedAnswers = activeCriteria.map((c) => {
        let pass = true;
        let answerText = 'Passed verification';
        if (c.category === 'budget') {
          answerText = `₦${Number(simLead.dealValue).toLocaleString()} confirmed budget`;
        } else if (c.category === 'authority') {
          answerText = `${simLead.title} (Primary Decision Maker)`;
        } else if (c.category === 'urgency') {
          answerText = simLead.timeline;
        } else {
          answerText = `Aligned with ${c.name}`;
        }
        if (pass) {
          calculatedScore += c.weight;
        }
        return {
          criterionName: c.name,
          category: c.category,
          question: c.qualifyingQuestion,
          answer: answerText,
          points: c.weight,
          pass,
        };
      });

      // Normalize score to 100 scale
      const normalizedScore = totalPossibleWeight > 0 ? Math.round((calculatedScore / totalPossibleWeight) * 100) : 85;
      const isQualified = normalizedScore >= minScore;
      const isUnicorn = normalizedScore >= 90;

      setTestResult({
        leadName: simLead.name,
        extractedScore: normalizedScore,
        tier: isUnicorn ? 'UNICORN' : isQualified ? 'QUALIFIED' : 'REVIEW',
        isQualified,
        extractedAnswers,
        recommendedAction: isQualified
          ? `Direct Closer Handoff + Auto-Propose Demo Slot (Score ${normalizedScore} >= ${minScore})`
          : `Placed in Setter Follow-Up Queue (Score ${normalizedScore} < ${minScore})`,
        generatedScript: `“Hello ${simLead.name.split(' ')[1] || 'there'}, our Senior Closer reviewed your requirements for ${simLead.notes.substring(0, 35)}... Let’s review our playbook on a 15-minute briefing.”`,
      });
    }, 600);
  };

  return (
    <div className="dashboard-canvas">
      {/* Header with Title and Deploy Action */}
      <div className="view-header" style={{ marginBottom: '20px' }}>
        <div className="view-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="role-badge superadmin" style={{ background: '#ff5722', color: '#fff' }}>08 QUALIFY LOGIC</span>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Tenant: <strong>{tenantDisplayName}</strong> (<code>{tenantId}</code>)</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
            CUSTOM LEAD QUALIFICATION <span style={{ color: '#ff5722' }}>RULES & AI BRAIN</span>
          </h1>
          <p style={{ fontSize: '12.5px', color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0 }}>
            CHOOSE, EDIT, AND ADD CUSTOM QUALIFICATION RULES FOR YOUR SALES CLOSERS. ENFORCED AUTONOMOUSLY BY THE 45S AI SETTER.
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
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Save size={16} /> SAVE & DEPLOY CRITERIA
          </button>
        </div>
      </div>

      {/* Educational Guide Callout */}
      {activeSubTab === 'guide' && (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--accent)', borderRadius: '12px', padding: '20px', marginBottom: '24px', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={20} color="#ff5722" />
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>How the 45-Second AI Lead Qualification Works</h3>
            </div>
            <button onClick={() => setActiveSubTab('editor')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--muted)' }}>✕ Close Guide</button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginTop: '14px' }}>
            <div style={{ background: 'var(--bg)', padding: '14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 800, fontSize: '13px', marginBottom: '6px' }}>
                <CheckCircle2 size={16} /> 1. Instant Triage (&lt;45s)
              </div>
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0, lineHeight: 1.4 }}>
                Inbound leads from Webhook, WhatsApp, or Meta Ads receive an instant response asking your custom qualifying questions.
              </p>
            </div>

            <div style={{ background: 'var(--bg)', padding: '14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3b82f6', fontWeight: 800, fontSize: '13px', marginBottom: '6px' }}>
                <Sliders size={16} /> 2. Score Calculation
              </div>
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0, lineHeight: 1.4 }}>
                Every enabled criterion contributes points. Leads scoring &gt;= {minScore} are verified as high-intent sales opportunities.
              </p>
            </div>

            <div style={{ background: 'var(--bg)', padding: '14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ff5722', fontWeight: 800, fontSize: '13px', marginBottom: '6px' }}>
                <Bot size={16} /> 3. Automated Demo Booking
              </div>
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0, lineHeight: 1.4 }}>
                Pre-qualified leads are autonomously booked onto your senior closer calendars (Google Meet, Cal.com) without manual setter back-and-forth.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Industry Vertical Tabs */}
      <div style={{ marginBottom: '22px' }}>
        <div style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={13} color="var(--accent-deep)" />
          Quick Load Industry Preset Rubric:
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'consulting', label: '💼 Consulting & Strategy', icon: Briefcase },
            { id: 'tech_services', label: '💻 IT & Custom Software', icon: Laptop },
            { id: 'financial_advisory', label: '💰 Financial Advisory', icon: DollarSign },
            { id: 'agency', label: '⚡ Marketing Agency', icon: Zap },
            { id: 'default', label: '🏢 Standard B2B Rules', icon: Building2 },
          ].map((item) => {
            const Icon = item.icon;
            const active = selectedIndustry === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectPreset(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
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
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.1fr', gap: '22px' }}>
        {/* Left Column: Criteria Customizer List & Score Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Minimum AI Score Threshold Card */}
          <div className="card" style={{ padding: '18px 20px', border: '1px solid var(--line)', borderRadius: '12px', background: 'var(--white)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={18} color="#ff5722" />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>
                  Minimum Sales-Ready Score Threshold
                </h3>
              </div>
              <span style={{ fontSize: '15px', fontWeight: 900, color: '#ff5722' }}>
                {minScore} / 100 Points
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={minScore}
              onChange={(e) => { setMinScore(Number(e.target.value)); setIsSaved(false); }}
              style={{ width: '100%', accentColor: '#ff5722', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
              <span>Lenient (50 pts)</span>
              <span>Balanced (75 pts)</span>
              <span>Strict / High-Ticket Only (95 pts)</span>
            </div>
          </div>

          {/* Criteria Management List Card */}
          <div className="card" style={{ padding: '20px', border: '1px solid var(--line)', borderRadius: '12px', background: 'var(--white)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, textTransform: 'uppercase' }}>
                  Custom Qualification Criteria ({criteria.filter((c) => c.enabled).length} Enabled)
                </h3>
                <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
                  Toggle criteria ON/OFF, edit weights, or add custom business conditions
                </span>
              </div>

              <button
                onClick={handleOpenAddCriterion}
                className="btn-accent"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  padding: '7px 12px',
                  background: '#ff5722',
                  color: '#fff',
                  border: 'none',
                }}
              >
                <Plus size={14} /> Add Criterion
              </button>
            </div>

            {/* List of Criteria */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {criteria.map((criterion) => {
                const categoryColors: Record<string, { bg: string; text: string }> = {
                  budget: { bg: '#dcfce7', text: '#166534' },
                  authority: { bg: '#fef3c7', text: '#92400e' },
                  urgency: { bg: '#fee2e2', text: '#991b1b' },
                  need: { bg: '#e0e7ff', text: '#3730a3' },
                  location: { bg: '#f1f5f9', text: '#475569' },
                  custom: { bg: '#f3e8ff', text: '#6b21a8' },
                };
                const catColor = categoryColors[criterion.category] || categoryColors.custom;

                return (
                  <div
                    key={criterion.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: criterion.enabled ? 'var(--paper)' : '#f9fafb',
                      border: criterion.enabled ? '1px solid var(--line)' : '1px dashed #d1d5db',
                      opacity: criterion.enabled ? 1 : 0.65,
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '12px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={criterion.enabled}
                        onChange={() => handleToggleCriterion(criterion.id)}
                        style={{ width: '16px', height: '16px', marginTop: '2px', accentColor: '#ff5722', cursor: 'pointer' }}
                        title="Toggle criterion ON or OFF"
                      />

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                          <span
                            style={{
                              fontSize: '9.5px',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '2px 5px',
                              borderRadius: '4px',
                              background: catColor.bg,
                              color: catColor.text,
                            }}
                          >
                            {criterion.category}
                          </span>

                          <strong style={{ fontSize: '13px', color: 'var(--ink)' }}>
                            {criterion.name}
                          </strong>

                          {criterion.thresholdValue && (
                            <span style={{ fontSize: '11px', background: 'var(--white)', border: '1px solid var(--line)', padding: '1px 6px', borderRadius: '4px', color: 'var(--muted)', fontWeight: 600 }}>
                              {criterion.thresholdValue}
                            </span>
                          )}

                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#ff5722', marginLeft: 'auto' }}>
                            +{criterion.weight} pts
                          </span>
                        </div>

                        <p style={{ margin: '0 0 5px 0', fontSize: '11.5px', color: 'var(--muted)', lineHeight: 1.35 }}>
                          {criterion.description}
                        </p>

                        <div
                          style={{
                            fontSize: '11px',
                            color: '#1e293b',
                            background: 'var(--white)',
                            padding: '5px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--line)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <MessageSquare size={11} color="#64748b" />
                          <span>
                            <strong>AI Prompt:</strong> <em>"{criterion.qualifyingQuestion}"</em>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        onClick={() => handleOpenEditCriterion(criterion)}
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--line)',
                          borderRadius: '6px',
                          padding: '5px 7px',
                          cursor: 'pointer',
                          color: 'var(--ink)',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                        title="Edit Criterion"
                      >
                        <Edit3 size={12} /> Edit
                      </button>

                      <button
                        onClick={() => handleDeleteCriterion(criterion.id)}
                        style={{
                          background: 'transparent',
                          border: '1px solid #fee2e2',
                          borderRadius: '6px',
                          padding: '5px 7px',
                          cursor: 'pointer',
                          color: '#ef4444',
                        }}
                        title="Delete Criterion"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Qualification Simulator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="card" style={{ padding: '22px', border: '1px solid var(--line)', borderRadius: '12px', background: 'var(--white)' }}>
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
                <span>{isSimulating ? 'Evaluating...' : 'Evaluate Test Lead'}</span>
              </button>
            </div>

            {/* Test Lead Form */}
            <div style={{ background: 'var(--paper)', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)', marginBottom: '14px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--ink)', marginBottom: '8px' }}>
                Test Prospect Parameters:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  value={simLead.name}
                  onChange={(e) => setSimLead({ ...simLead, name: e.target.value })}
                  placeholder="Lead Name / Company"
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '12px' }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    value={simLead.title}
                    onChange={(e) => setSimLead({ ...simLead, title: e.target.value })}
                    placeholder="Job Title"
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '12px' }}
                  />
                  <input
                    value={simLead.dealValue}
                    onChange={(e) => setSimLead({ ...simLead, dealValue: e.target.value })}
                    placeholder="Budget (₦)"
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '12px' }}
                  />
                </div>
              </div>
            </div>

            {testResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Score Pill Card */}
                <div
                  style={{
                    background: testResult.isQualified ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 87, 34, 0.1)',
                    border: `1px solid ${testResult.isQualified ? '#10b981' : '#ff5722'}`,
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
                    <div style={{ fontSize: '18px', fontWeight: 900, color: testResult.isQualified ? '#059669' : '#ff5722' }}>
                      {testResult.tier} ({testResult.extractedScore}/100)
                    </div>
                  </div>
                  <span
                    className="role-badge superadmin"
                    style={{ background: testResult.isQualified ? '#10b981' : '#ff5722', color: '#fff' }}
                  >
                    {testResult.isQualified ? 'QUALIFIED FOR CLOSER' : 'NEEDS NURTURE'}
                  </span>
                </div>

                {/* Criteria Pass Breakdown */}
                <div style={{ background: 'var(--paper)', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '8px' }}>
                    Evaluated Criteria Rubric:
                  </div>
                  {testResult.extractedAnswers?.map((item: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--ink)' }}>• {item.criterionName}:</span>
                      <strong style={{ color: item.pass ? '#059669' : '#ef4444' }}>
                        +{item.points} pts (Pass)
                      </strong>
                    </div>
                  ))}
                </div>

                {/* Actionable Script */}
                <div style={{ background: 'rgba(255, 87, 34, 0.05)', padding: '12px', borderRadius: '8px', border: '1px dashed #ff5722' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#ff5722', marginBottom: '4px' }}>
                    AI Setter Action:
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--ink)', margin: 0, fontStyle: 'italic', lineHeight: 1.4 }}>
                    {testResult.recommendedAction}
                  </p>
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: 'var(--paper)',
                  padding: '24px',
                  borderRadius: '8px',
                  border: '1px dashed var(--line)',
                  textAlign: 'center',
                  color: 'var(--muted)',
                  fontSize: '12.5px',
                }}
              >
                Click "Evaluate Test Lead" to run your active qualification rubric against this prospect.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CRITERIA ADD / EDIT MODAL */}
      {(isAddingCriterion || editingCriterion) && (
        <div className="modal-overlay" onClick={() => { setIsAddingCriterion(false); setEditingCriterion(null); }}>
          <div
            className="modal-content"
            style={{ maxWidth: '580px', maxHeight: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
                  {editingCriterion ? 'Edit Qualification Criterion' : 'Add Custom Qualification Criterion'}
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                  Define the qualification condition and exact question asked by the AI engine
                </p>
              </div>
              <button
                onClick={() => { setIsAddingCriterion(false); setEditingCriterion(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCriterionForm} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                      Criterion Name *
                    </label>
                    <input
                      required
                      value={critForm.name}
                      onChange={(e) => setCritForm({ ...critForm, name: e.target.value })}
                      placeholder="e.g. Require 20+ Staff or ₦2M Budget"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                      Category
                    </label>
                    <select
                      value={critForm.category}
                      onChange={(e) => setCritForm({ ...critForm, category: e.target.value as any })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px', background: 'var(--white)' }}
                    >
                      <option value="budget">Budget / Deal Size</option>
                      <option value="authority">Decision Maker Authority</option>
                      <option value="urgency">Urgency / Timeline</option>
                      <option value="need">Service Need & Scope</option>
                      <option value="location">Geographic Location</option>
                      <option value="custom">Custom Requirement</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                      Threshold / Target Value
                    </label>
                    <input
                      value={critForm.thresholdValue}
                      onChange={(e) => setCritForm({ ...critForm, thresholdValue: e.target.value })}
                      placeholder="e.g. ₦1,500,000+ or MD / Founder"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                      Score Contribution (Weight)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="50"
                      value={critForm.weight}
                      onChange={(e) => setCritForm({ ...critForm, weight: Number(e.target.value) })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                    Description
                  </label>
                  <input
                    value={critForm.description}
                    onChange={(e) => setCritForm({ ...critForm, description: e.target.value })}
                    placeholder="e.g. Validates that the client has approved budget before routing to senior closers"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                    💬 AI Setter Discovery Question
                  </label>
                  <textarea
                    rows={3}
                    value={critForm.qualifyingQuestion}
                    onChange={(e) => setCritForm({ ...critForm, qualifyingQuestion: e.target.value })}
                    placeholder="e.g. What budget range has your board approved for this advisory project?"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '12.5px', lineHeight: 1.4 }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    This is the exact question the autonomous AI setter will ask the lead on WhatsApp, SMS, or inbound chat.
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => { setIsAddingCriterion(false); setEditingCriterion(null); }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-accent" style={{ padding: '9px 20px', fontWeight: 700, background: '#ff5722', color: '#fff', border: 'none' }}>
                  <Check size={14} /> {editingCriterion ? 'Save Changes' : 'Add Criterion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
