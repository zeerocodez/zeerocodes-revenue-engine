import { useState } from 'react';
import {
  DollarSign,
  Filter,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tag,
  User,
  X,
  ArrowRight,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { DEAL_STAGES_CONFIG, type DealRecord, type DealStage } from '../../domain/deal';
import type { UserSession } from '../auth/AuthModal';

const INITIAL_DEALS: DealRecord[] = [
  {
    id: 'deal_1',
    organizationId: 'zeerocodes-hq',
    title: 'Enterprise Revenue Automation Suite',
    contactName: 'Adeola Adeleke',
    companyName: 'Interswitch Group',
    value: 12500000,
    currency: 'NGN',
    stage: 'negotiation',
    probability: 90,
    ownerId: 'usr_folake',
    ownerName: 'Folake Adeleke',
    expectedCloseDate: '2026-09-30',
    priority: 'critical',
    tags: ['FinTech', 'High-Priority', 'Q3-Closing'],
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-15T14:30:00Z',
  },
  {
    id: 'deal_2',
    organizationId: 'zeerocodes-hq',
    title: 'AI SDR Lead Ingestion & Qualification Engine',
    contactName: 'Chima Obi',
    companyName: 'Kuda Microfinance Bank',
    value: 8200000,
    currency: 'NGN',
    stage: 'demo_scheduled',
    probability: 60,
    ownerId: 'usr_emeka',
    ownerName: 'Emeka Nwosu',
    expectedCloseDate: '2026-10-05',
    priority: 'high',
    tags: ['Banking', 'WhatsApp-Inbound'],
    createdAt: '2026-09-10T09:15:00Z',
    updatedAt: '2026-09-16T11:20:00Z',
  },
  {
    id: 'deal_3',
    organizationId: 'zeerocodes-hq',
    title: 'Multi-Channel Inbound Leakage Recovery',
    contactName: 'Dr. Amina Bello',
    companyName: 'Apex Health Systems',
    value: 4500000,
    currency: 'NGN',
    stage: 'proposal_sent',
    probability: 75,
    ownerId: 'usr_folake',
    ownerName: 'Folake Adeleke',
    expectedCloseDate: '2026-09-28',
    priority: 'medium',
    tags: ['Healthcare', 'Speed-to-Lead'],
    createdAt: '2026-09-05T08:00:00Z',
    updatedAt: '2026-09-14T16:00:00Z',
  },
  {
    id: 'deal_4',
    organizationId: 'zeerocodes-hq',
    title: 'Sales CRM & Speed-to-Lead Rollout',
    contactName: 'Tunde Lawal',
    companyName: 'Prime Logistics Nigeria',
    value: 3200000,
    currency: 'NGN',
    stage: 'qualification',
    probability: 40,
    ownerId: 'usr_emeka',
    ownerName: 'Emeka Nwosu',
    expectedCloseDate: '2026-10-15',
    priority: 'medium',
    tags: ['Logistics', 'Meta-Ads'],
    createdAt: '2026-09-12T13:40:00Z',
    updatedAt: '2026-09-15T09:00:00Z',
  },
  {
    id: 'deal_5',
    organizationId: 'zeerocodes-hq',
    title: 'Inbound Revenue Recovery Retainer',
    contactName: 'Ngozi Okoli',
    companyName: 'Paystack Merchants Network',
    value: 9600000,
    currency: 'NGN',
    stage: 'closed_won',
    probability: 100,
    ownerId: 'usr_sarah',
    ownerName: 'Sarah Alabi',
    expectedCloseDate: '2026-09-12',
    priority: 'high',
    tags: ['Payments', 'Won-Deal'],
    createdAt: '2026-08-20T10:00:00Z',
    updatedAt: '2026-09-12T17:00:00Z',
  },
];

interface SalesPipelineWorkspaceProps {
  session: UserSession;
}

export default function SalesPipelineWorkspace({ session }: SalesPipelineWorkspaceProps) {
  const [deals, setDeals] = useState<DealRecord[]>(INITIAL_DEALS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOwner, setSelectedOwner] = useState<string>('all');
  const [isNewDealOpen, setIsNewDealOpen] = useState(false);
  const [activeDealModal, setActiveDealModal] = useState<DealRecord | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formValue, setFormValue] = useState(2500000);
  const [formStage, setFormStage] = useState<DealStage>('discovery');

  const filteredDeals = deals.filter((deal) => {
    const matchSearch =
      deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.contactName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchOwner = selectedOwner === 'all' || deal.ownerName === selectedOwner;
    return matchSearch && matchOwner;
  });

  const totalPipelineValue = filteredDeals.reduce((sum, d) => sum + d.value, 0);
  const weightedPipelineValue = filteredDeals.reduce((sum, d) => sum + (d.value * d.probability) / 100, 0);

  const handleCreateDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formCompany.trim()) return;

    const newDeal: DealRecord = {
      id: `deal_${Date.now()}`,
      organizationId: session.tenantId,
      title: formTitle.trim(),
      contactName: formContact.trim() || 'New Contact',
      companyName: formCompany.trim(),
      value: Number(formValue),
      currency: 'NGN',
      stage: formStage,
      probability: DEAL_STAGES_CONFIG.find((s) => s.id === formStage)?.probability ?? 20,
      ownerId: session.userId,
      ownerName: session.userName,
      expectedCloseDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      priority: 'medium',
      tags: ['Sales-CRM', 'Pipeline'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDeals([newDeal, ...deals]);
    setIsNewDealOpen(false);
    setFormTitle('');
    setFormCompany('');
    setFormContact('');
  };

  const moveDealStage = (dealId: string, targetStage: DealStage) => {
    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId
          ? {
              ...d,
              stage: targetStage,
              probability: DEAL_STAGES_CONFIG.find((s) => s.id === targetStage)?.probability ?? d.probability,
              updatedAt: new Date().toISOString(),
            }
          : d
      )
    );
    if (activeDealModal && activeDealModal.id === dealId) {
      setActiveDealModal((prev) => (prev ? { ...prev, stage: targetStage } : null));
    }
  };

  return (
    <div className="dashboard-canvas">
      {/* Header */}
      <div className="view-header">
        <div className="view-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="role-badge closer">Sales CRM</span>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Tenant: <strong>{session.tenantName}</strong></span>
          </div>
          <h1>
            Deals & Opportunity Kanban Pipeline
            <span style={{ fontSize: '13.5px', background: 'var(--white)', border: '1px solid var(--line)', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontWeight: 800, color: 'var(--ink)' }}>
              Total: ₦{totalPipelineValue.toLocaleString()} (Weighted: ₦{Math.round(weightedPipelineValue).toLocaleString()})
            </span>
          </h1>
          <p>Drag, manage, and close deals across full lifecycle stages with real-time revenue weighting.</p>
        </div>

        <div className="view-actions">
          <button className="btn-accent" onClick={() => setIsNewDealOpen(true)}>
            <Plus size={16} /> New Opportunity
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '450px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input
              type="text"
              placeholder="Search deals, contacts, or companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 38px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--line)',
                background: 'var(--white)',
                fontSize: '13.5px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={selectedOwner}
            onChange={(e) => setSelectedOwner(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--line)',
              background: 'var(--white)',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--ink)',
            }}
          >
            <option value="all">All Sales Owners</option>
            <option value="Folake Adeleke">Folake Adeleke (Closer)</option>
            <option value="Emeka Nwosu">Emeka Nwosu (SDR)</option>
            <option value="Sarah Alabi">Sarah Alabi (Owner)</option>
          </select>
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="kanban-board">
        {DEAL_STAGES_CONFIG.map((stage) => {
          const stageDeals = filteredDeals.filter((d) => d.stage === stage.id);
          const stageValue = stageDeals.reduce((sum, d) => sum + d.value, 0);

          return (
            <div key={stage.id} className="kanban-column">
              <div className="kanban-col-header">
                <div className="kanban-col-title">
                  <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: stage.color }} />
                  {stage.label}
                </div>
                <span className="kanban-count">{stageDeals.length}</span>
              </div>

              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', marginBottom: '12px', padding: '0 4px' }}>
                ₦{stageValue.toLocaleString()}
              </div>

              <div className="kanban-cards-stack">
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="kanban-card"
                    onClick={() => setActiveDealModal(deal)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <span className={`role-badge ${deal.priority === 'critical' ? 'owner' : deal.priority === 'high' ? 'admin' : 'viewer'}`}>
                        {deal.priority}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{deal.probability}% win prob</span>
                    </div>

                    <h4 className="kanban-card-title">{deal.title}</h4>
                    <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '8px' }}>
                      🏢 {deal.companyName} ({deal.contactName})
                    </div>

                    <div className="kanban-card-amount">
                      ₦{deal.value.toLocaleString()}
                    </div>

                    <div className="kanban-card-footer">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <User size={12} /> {deal.ownerName}
                      </span>
                      <span>📅 {deal.expectedCloseDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Deal Modal */}
      {isNewDealOpen && (
        <div className="modal-overlay" onClick={() => setIsNewDealOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>Create New Sales Opportunity</h3>
              <button onClick={() => setIsNewDealOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateDeal}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>Deal / Opportunity Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Enterprise RevEngine Contract"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>Company Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Flutterwave Nigeria"
                      value={formCompany}
                      onChange={(e) => setFormCompany(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>Primary Contact</label>
                    <input
                      type="text"
                      placeholder="e.g. Funke Otedola"
                      value={formContact}
                      onChange={(e) => setFormContact(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>Deal Value (NGN)</label>
                    <input
                      type="number"
                      required
                      min={100000}
                      step={50000}
                      value={formValue}
                      onChange={(e) => setFormValue(Number(e.target.value))}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '6px' }}>Pipeline Stage</label>
                    <select
                      value={formStage}
                      onChange={(e) => setFormStage(e.target.value as DealStage)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
                    >
                      {DEAL_STAGES_CONFIG.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsNewDealOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Deal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deal Details & Stage Transition Modal */}
      {activeDealModal && (
        <div className="modal-overlay" onClick={() => setActiveDealModal(null)}>
          <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="status-pill won" style={{ marginBottom: '4px' }}>₦{activeDealModal.value.toLocaleString()}</span>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 800 }}>{activeDealModal.title}</h3>
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--muted)' }}>{activeDealModal.companyName} • Contact: {activeDealModal.contactName}</p>
              </div>
              <button onClick={() => setActiveDealModal(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, marginBottom: '8px' }}>
                  Move Opportunity Stage:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {DEAL_STAGES_CONFIG.map((stage) => {
                    const active = activeDealModal.stage === stage.id;
                    return (
                      <button
                        key={stage.id}
                        type="button"
                        onClick={() => moveDealStage(activeDealModal.id, stage.id)}
                        style={{
                          padding: '10px 8px',
                          borderRadius: '8px',
                          border: active ? `2px solid ${stage.color}` : '1px solid var(--line)',
                          background: active ? `${stage.color}15` : 'var(--white)',
                          color: 'var(--ink)',
                          fontSize: '12px',
                          fontWeight: active ? 800 : 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        {active && <CheckCircle2 size={14} color={stage.color} />}
                        {stage.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ padding: '14px', background: 'var(--paper)', borderRadius: '10px', border: '1px solid var(--line)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div><strong>Assigned Rep:</strong> {activeDealModal.ownerName}</div>
                <div><strong>Win Probability:</strong> {activeDealModal.probability}%</div>
                <div><strong>Expected Close:</strong> {activeDealModal.expectedCloseDate}</div>
                <div><strong>Priority:</strong> {activeDealModal.priority.toUpperCase()}</div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setActiveDealModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
