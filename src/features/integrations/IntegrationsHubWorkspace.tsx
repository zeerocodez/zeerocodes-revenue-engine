import { useState } from 'react';
import {
  Activity,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Copy,
  Globe,
  Key,
  Layers,
  MessageSquare,
  Play,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import type { UserSession } from '../auth/AuthModal';

interface IntegrationConnector {
  id: string;
  name: string;
  category: 'advertising' | 'messaging' | 'crm' | 'webhook';
  icon: string;
  status: 'connected' | 'disconnected' | 'syncing';
  eventsProcessed: number;
  lastEventTime: string;
  description: string;
}

const CONNECTORS: IntegrationConnector[] = [
  {
    id: 'meta_ads',
    name: 'Meta Lead Ads (Facebook & Instagram)',
    category: 'advertising',
    icon: '📱',
    status: 'connected',
    eventsProcessed: 612,
    lastEventTime: '4m ago',
    description: 'Instant webhook intake directly from Facebook & Instagram Instant Forms.',
  },
  {
    id: 'whatsapp_cloud',
    name: 'WhatsApp Cloud Business API',
    category: 'messaging',
    icon: '💬',
    status: 'connected',
    eventsProcessed: 1840,
    lastEventTime: '1m ago',
    description: 'Two-way automated conversational AI qualification and speed-to-lead triage.',
  },
  {
    id: 'google_ads',
    name: 'Google Ads Enhanced Conversions',
    category: 'advertising',
    icon: '🔍',
    status: 'connected',
    eventsProcessed: 390,
    lastEventTime: '12m ago',
    description: 'Closed-loop offline conversion sync to optimize Google PPC campaigns.',
  },
  {
    id: 'zapier_webhook',
    name: 'Zapier & Make.com Webhooks',
    category: 'webhook',
    icon: '⚡',
    status: 'connected',
    eventsProcessed: 840,
    lastEventTime: '22m ago',
    description: 'Custom ingestion endpoint for external landing pages and Typeform leads.',
  },
  {
    id: 'hubspot_crm',
    name: 'HubSpot / Salesforce Sync',
    category: 'crm',
    icon: '🏢',
    status: 'disconnected',
    eventsProcessed: 0,
    lastEventTime: 'Never',
    description: 'Bi-directional opportunity and deal sync with enterprise CRM suites.',
  },
];

interface IntegrationsHubWorkspaceProps {
  session: UserSession;
}

export default function IntegrationsHubWorkspace({ session }: IntegrationsHubWorkspaceProps) {
  const [connectors, setConnectors] = useState<IntegrationConnector[]>(CONNECTORS);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Simulation State
  const [simName, setSimName] = useState('Olumide Williams');
  const [simCompany, setSimCompany] = useState('Zenith Holdings');
  const [simPhone, setSimPhone] = useState('+234 802 333 7788');
  const [simBudget, setSimBudget] = useState(3500000);
  const [simUrgency, setSimUrgency] = useState(2);
  const [simDecisionMaker, setSimDecisionMaker] = useState(true);
  const [simChannel, setSimChannel] = useState<'whatsapp' | 'meta' | 'google'>('whatsapp');
  const [simulationResult, setSimulationResult] = useState<{
    leadId: string;
    score: number;
    band: string;
    route: string;
    action: string;
    qualificationStatus: string;
    timestamp: string;
  } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const webhookUrl = `${window.location.origin}/api/public/lead-intake?tenant=${session.tenantId}`;

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      // Calculate realistic score
      let score = 40;
      if (simBudget >= 2000000) score += 30;
      if (simUrgency <= 3) score += 20;
      if (simDecisionMaker) score += 10;

      const band = score >= 85 ? 'Critical / High-Intent' : score >= 65 ? 'Qualified' : 'Nurture';
      const route = score >= 75 ? 'SDR Priority Queue' : 'AI Autonomous Follow-up';
      const action = score >= 75 ? 'Immediate Call Dispatch' : 'Conversational Q&A Loop';

      setSimulationResult({
        leadId: `lead_sim_${Date.now()}`,
        score,
        band,
        route,
        action,
        qualificationStatus: 'Sales-Ready Qualified',
        timestamp: new Date().toLocaleTimeString(),
      });
      setIsSimulating(false);
    }, 600);
  };

  return (
    <div className="dashboard-canvas">
      {/* Header */}
      <div className="view-header">
        <div className="view-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="role-badge superadmin">Integrations & API</span>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Tenant: <strong>{session.tenantName}</strong></span>
          </div>
          <h1>
            Integrations & Live Inbound Simulator
            <span style={{ fontSize: '13px', background: 'var(--accent-bg)', color: 'var(--accent-deep)', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
              4 Connected
            </span>
          </h1>
          <p>Manage multi-channel ingestion webhooks and test live lead intake scoring in real time.</p>
        </div>
      </div>

      {/* Webhook Endpoint Banner */}
      <div className="dark-panel" style={{ marginBottom: '28px' }}>
        <div className="dark-panel-header">
          <div className="dark-panel-title">
            <Key size={18} color="var(--accent)" />
            Tenant Ingestion Webhook Endpoint
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--accent)', fontWeight: 700 }}>HTTPS JSON POST</span>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--dark-muted)', marginBottom: '14px' }}>
          Connect your landing page forms, Facebook Lead Gen ads, or Zapier webhooks to this secure tenant URL.
        </p>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            readOnly
            value={webhookUrl}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'var(--dark-surface)',
              border: '1px solid var(--dark-border)',
              color: 'var(--accent)',
              fontFamily: 'monospace',
              fontSize: '13px',
              outline: 'none',
            }}
          />
          <button className="btn-accent" onClick={handleCopyWebhook}>
            {copiedWebhook ? <Check size={16} /> : <Copy size={16} />}
            {copiedWebhook ? 'Copied!' : 'Copy URL'}
          </button>
        </div>
      </div>

      {/* Split Grid: Connectors & Live Lead Simulator */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr', gap: '24px', marginBottom: '28px' }}>
        {/* Left: Connected Platforms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>Active Channels & Connectors</h3>

          {connectors.map((c) => (
            <div
              key={c.id}
              className="table-card"
              style={{
                padding: '18px 20px',
                margin: 0,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{ fontSize: '28px' }}>{c.icon}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ fontSize: '14.5px', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>{c.name}</h4>
                    <span className={`status-pill ${c.status === 'connected' ? 'won' : 'lost'}`}>
                      {c.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '3px' }}>{c.description}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ink)', marginTop: '4px', fontWeight: 600 }}>
                    ⚡ {c.eventsProcessed} events received • Last: {c.lastEventTime}
                  </div>
                </div>
              </div>

              <button
                className={c.status === 'connected' ? 'btn-secondary' : 'btn-accent'}
                style={{ padding: '6px 14px', fontSize: '12px', flexShrink: 0 }}
                onClick={() => {
                  setConnectors((prev) =>
                    prev.map((item) =>
                      item.id === c.id
                        ? { ...item, status: item.status === 'connected' ? 'disconnected' : 'connected' }
                        : item
                    )
                  );
                }}
              >
                {c.status === 'connected' ? 'Configure' : 'Connect'}
              </button>
            </div>
          ))}
        </div>

        {/* Right: Live Inbound Lead Simulator */}
        <div className="table-card" style={{ padding: '24px', margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="var(--accent-deep)" />
                Live Inbound Lead Simulator
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '2px 0 0 0' }}>
                Inject a sample lead to test AI scoring and routing engine
              </p>
            </div>
            <span className="status-pill won">Interactive</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px' }}>Lead Name</label>
                <input
                  type="text"
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px' }}>Company Name</label>
                <input
                  type="text"
                  value={simCompany}
                  onChange={(e) => setSimCompany(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px' }}>Budget (NGN)</label>
                <input
                  type="number"
                  step={500000}
                  value={simBudget}
                  onChange={(e) => setSimBudget(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px' }}>Urgency (Days)</label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={simUrgency}
                  onChange={(e) => setSimUrgency(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--paper)', borderRadius: '8px', border: '1px solid var(--line)' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 600 }}>Decision Maker Confirmed:</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={simDecisionMaker}
                  onChange={(e) => setSimDecisionMaker(e.target.checked)}
                  style={{ accentColor: 'var(--ink)' }}
                />
                Yes (Authorized)
              </label>
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '6px' }}
              onClick={handleRunSimulation}
              disabled={isSimulating}
            >
              {isSimulating ? <RefreshCw size={15} className="animate-spin" /> : <Play size={15} />}
              {isSimulating ? 'Evaluating Policy...' : 'Simulate Inbound Lead'}
            </button>
          </div>

          {/* Simulation Output Card */}
          {simulationResult && (
            <div style={{ padding: '14px', background: 'var(--dark)', color: '#fff', borderRadius: '10px', border: '1px solid var(--dark-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 800 }}>⚡ Policy Evaluation Result</span>
                <span style={{ fontSize: '11px', color: 'var(--dark-muted)' }}>{simulationResult.timestamp}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span>Score: <strong style={{ color: 'var(--accent)' }}>{simulationResult.score}/100</strong></span>
                <span>Band: <strong>{simulationResult.band}</strong></span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--dark-muted)', borderTop: '1px dashed var(--dark-border)', paddingTop: '6px' }}>
                Route: <strong style={{ color: '#fff' }}>{simulationResult.route}</strong>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--dark-muted)' }}>
                Action: <strong style={{ color: '#fff' }}>{simulationResult.action}</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
