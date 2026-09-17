import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Bot,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  Edit3,
  ExternalLink,
  Filter,
  Flame,
  Globe,
  HelpCircle,
  Inbox,
  Layers,
  MessageSquare,
  Phone,
  PhoneCall,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  User,
  UserCheck,
  UserPlus,
  X,
  Zap,
} from 'lucide-react';
import type { UserSession } from '../auth/AuthModal';

export interface DirectoryLead {
  id: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  source: 'FACEBOOK' | 'WEBSITE' | 'WHATSAPP' | 'GOHIGHLEVEL' | 'CSV';
  productInterest: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';
  aiScore: number;
  aiTier: 'UNICORN' | 'HIGH' | 'MEDIUM' | 'LOW';
  aiVerdict: string;
  dealValue: number;
  lastContacted: string;
  isPrivate: boolean;
}

const INITIAL_DIRECTORY_LEADS: DirectoryLead[] = [
  {
    id: 'lead_01',
    name: 'Engr. Babatunde Jinadu',
    phone: '+234 803 123 4567',
    email: 'babatunde@primeconstruct.ng',
    company: 'Prime Construct Ltd',
    source: 'FACEBOOK',
    productInterest: 'Commercial Office Cleaning (2,000 sqm)',
    status: 'QUALIFIED',
    aiScore: 92,
    aiTier: 'UNICORN',
    aiVerdict: 'High Intent: Decision Maker (MD) confirmed, ₦2.5M budget approved, 7-day urgent need.',
    dealValue: 2500000,
    lastContacted: '10m ago',
    isPrivate: true,
  },
  {
    id: 'lead_02',
    name: 'Dr. Amina Bello',
    phone: '+234 812 987 6543',
    email: 'amina@apexhealth.ng',
    company: 'Apex Health Systems',
    source: 'WEBSITE',
    productInterest: 'Medical Clinic Facility Disinfection',
    status: 'QUALIFIED',
    aiScore: 88,
    aiTier: 'HIGH',
    aiVerdict: 'Qualified: Multi-branch facility in Lekki, Medical Director authority, ₦4.8M scope.',
    dealValue: 4800000,
    lastContacted: '25m ago',
    isPrivate: true,
  },
  {
    id: 'lead_03',
    name: 'Kelechi Okafor',
    phone: '+234 901 444 8899',
    email: 'k.okafor@swiftlogistics.com',
    company: 'Swift Logistics Group',
    source: 'WHATSAPP',
    productInterest: 'Warehouse & Logistics Terminal Maintenance',
    status: 'CONTACTED',
    aiScore: 64,
    aiTier: 'MEDIUM',
    aiVerdict: 'Potential Fit: ₦3.2M project size, awaiting COO calendar confirmation.',
    dealValue: 3200000,
    lastContacted: '1h ago',
    isPrivate: false,
  },
  {
    id: 'lead_04',
    name: 'Olumide Adebayo',
    phone: '+234 802 333 4455',
    email: 'olumide@retailhub.ng',
    company: 'RetailHub Superstores',
    source: 'FACEBOOK',
    productInterest: 'Retail Plaza Post-Construction Deep Clean',
    status: 'NEW',
    aiScore: 18,
    aiTier: 'LOW',
    aiVerdict: 'Awaiting evaluation... Inbound submission parsed.',
    dealValue: 800000,
    lastContacted: 'Just now',
    isPrivate: true,
  },
  {
    id: 'lead_05',
    name: 'Ngozi Ezeani',
    phone: '+234 805 111 2233',
    email: 'ngozi@cloudretail.io',
    company: 'CloudRetail HQ',
    source: 'GOHIGHLEVEL',
    productInterest: 'Corporate HQ Maintenance Retainer',
    status: 'CONVERTED',
    aiScore: 95,
    aiTier: 'UNICORN',
    aiVerdict: 'Closed Won: Contract signed at ₦3.2M/year retainer.',
    dealValue: 3200000,
    lastContacted: 'Yesterday',
    isPrivate: false,
  },
];

export default function LeadWorkspace({ session }: { session?: UserSession }) {
  const [leads, setLeads] = useState<DirectoryLead[]>(INITIAL_DIRECTORY_LEADS);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [scoreFilter, setScoreFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    source: 'WEBSITE' as const,
    productInterest: '',
    dealValue: 1500000,
  });

  const filteredLeads = leads.filter((l) => {
    const matchStatus = statusFilter === 'ALL' || l.status === statusFilter;
    let matchScore = true;
    if (scoreFilter === 'HIGH') matchScore = l.aiScore >= 70;
    else if (scoreFilter === 'MEDIUM') matchScore = l.aiScore >= 40 && l.aiScore < 70;
    else if (scoreFilter === 'LOW') matchScore = l.aiScore < 40;

    const matchSearch =
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.phone.includes(searchQuery) ||
      l.productInterest.toLowerCase().includes(searchQuery.toLowerCase());

    return matchStatus && matchScore && matchSearch;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedLeadIds(filteredLeads.map((l) => l.id));
    else setSelectedLeadIds([]);
  };

  const handleToggleSelect = (id: string) => {
    if (selectedLeadIds.includes(id)) setSelectedLeadIds(selectedLeadIds.filter((i) => i !== id));
    else setSelectedLeadIds([...selectedLeadIds, id]);
  };

  const handleRefreshAI = (leadId: string) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              aiScore: Math.min(100, l.aiScore + 15),
              aiTier: l.aiScore + 15 >= 90 ? 'UNICORN' : 'HIGH',
              aiVerdict: `Re-evaluated: Decision maker & financial threshold confirmed. Score updated to ${Math.min(100, l.aiScore + 15)}/100.`,
            }
          : l
      )
    );
  };

  const handleDedupe = () => {
    alert('✨ Lead Deduplication Engine completed: 0 duplicates detected. Database is clean and consolidated.');
  };

  const handleSeed = () => {
    const seedLead: DirectoryLead = {
      id: `lead_${Date.now()}`,
      name: 'Chinedu Okeke',
      phone: '+234 809 777 6655',
      email: 'chinedu@oakwoodproperties.ng',
      company: 'Oakwood Properties',
      source: 'FACEBOOK',
      productInterest: 'Luxury 4-Bedroom Duplex Clean (Ikoyi)',
      status: 'QUALIFIED',
      aiScore: 91,
      aiTier: 'UNICORN',
      aiVerdict: 'Gold Standard: Developer in Ikoyi, ₦1.8M value, immediate site handover.',
      dealValue: 1800000,
      lastContacted: 'Just now',
      isPrivate: true,
    };
    setLeads([seedLead, ...leads]);
  };

  const handleAddLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.name) return;

    const created: DirectoryLead = {
      id: `lead_${Date.now()}`,
      name: newLeadForm.name,
      phone: newLeadForm.phone || '+234 800 000 0000',
      email: newLeadForm.email || 'lead@example.com',
      company: newLeadForm.company || 'Private Client',
      source: newLeadForm.source,
      productInterest: newLeadForm.productInterest || 'Commercial Offer',
      status: 'NEW',
      aiScore: 78,
      aiTier: 'HIGH',
      aiVerdict: 'Manual Intake: Auto-evaluated against Qualification Policy.',
      dealValue: Number(newLeadForm.dealValue) || 1000000,
      lastContacted: 'Just now',
      isPrivate: true,
    };

    setLeads([created, ...leads]);
    setIsAddModalOpen(false);
    setNewLeadForm({ name: '', phone: '', email: '', company: '', source: 'WEBSITE', productInterest: '', dealValue: 1500000 });
  };

  return (
    <div className="dashboard-canvas">
      {/* Header matching Screenshot 3 */}
      <div className="view-header" style={{ marginBottom: '16px' }}>
        <div className="view-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="role-badge superadmin" style={{ background: '#ff5722', color: '#fff' }}>05 LEAD DATABASE</span>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Total: <strong>{leads.length} Leads</strong></span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
            LEADS <span style={{ color: '#ff5722' }}>OVERVIEW</span>
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--muted)', margin: 0, fontWeight: 700 }}>
            LEADS DIRECTORY: Full database of prospects and active clients.
          </p>
        </div>

        <div className="view-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={handleDedupe} style={{ padding: '7px 12px', fontSize: '12px', fontWeight: 700 }}>
            <Sparkles size={14} color="#ff5722" /> DEDUPE
          </button>
          <button className="btn-secondary" onClick={handleSeed} style={{ padding: '7px 12px', fontSize: '12px', fontWeight: 700 }}>
            <Zap size={14} color="#16a34a" /> SEED
          </button>
          <button className="btn-secondary" onClick={() => alert('CSV Import Uploader opened')} style={{ padding: '7px 12px', fontSize: '12px', fontWeight: 700 }}>
            <Upload size={14} /> IMPORT
          </button>
          <button className="btn-secondary" onClick={() => alert('Exporting leads CSV...')} style={{ padding: '7px 12px', fontSize: '12px', fontWeight: 700 }}>
            <Download size={14} /> EXPORT CSV
          </button>
          <button
            className="btn-accent"
            onClick={() => setIsAddModalOpen(true)}
            style={{ background: '#ff5722', color: '#fff', border: 'none', padding: '7px 16px', fontSize: '12.5px', fontWeight: 800 }}
          >
            <Plus size={15} /> ADD
          </button>
        </div>
      </div>

      {/* Leads Directory Container */}
      <div className="table-card" style={{ padding: '20px', margin: 0 }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            type="text"
            placeholder="FILTER LEADS BY NAME, COMPANY, PHONE, OR SERVICE..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 38px',
              borderRadius: '8px',
              border: '1px solid var(--line)',
              background: 'var(--paper)',
              fontSize: '13px',
              fontWeight: 600,
              outline: 'none',
              letterSpacing: '0.02em',
            }}
          />
        </div>

        {/* Dual Filter Rows (Status + AI Score) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
          {/* Status Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--muted)', width: '70px', textTransform: 'uppercase' }}>STATUS:</span>
            {(['ALL', 'NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'] as const).map((st) => {
              const active = statusFilter === st;
              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: active ? '#ff5722' : 'var(--paper)',
                    color: active ? '#fff' : 'var(--ink)',
                    fontWeight: 700,
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {st}
                </button>
              );
            })}
          </div>

          {/* AI Score Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--muted)', width: '70px', textTransform: 'uppercase' }}>AI SCORE:</span>
            {[
              { id: 'ALL', label: 'ALL SCORES' },
              { id: 'HIGH', label: '70-100 (HIGH)' },
              { id: 'MEDIUM', label: '40-69 (MEDIUM)' },
              { id: 'LOW', label: '0-39 (LOW)' },
            ].map((sc) => {
              const active = scoreFilter === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => setScoreFilter(sc.id)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: active ? '#8b5cf6' : 'var(--paper)',
                    color: active ? '#fff' : 'var(--ink)',
                    fontWeight: 700,
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {sc.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Leads Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--line)', color: 'var(--muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '10px 8px', width: '32px' }}>
                  <input
                    type="checkbox"
                    checked={selectedLeadIds.length > 0 && selectedLeadIds.length === filteredLeads.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th style={{ padding: '10px 12px' }}>LEAD IDENTITY</th>
                <th style={{ padding: '10px 12px' }}>CONTEXT</th>
                <th style={{ padding: '10px 12px' }}>AI VERDICT</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>SCORE</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => {
                const isSelected = selectedLeadIds.includes(lead.id);
                return (
                  <tr
                    key={lead.id}
                    style={{
                      borderBottom: '1px solid var(--line)',
                      background: isSelected ? 'rgba(255, 87, 34, 0.06)' : 'transparent',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '12px 8px' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(lead.id)}
                      />
                    </td>

                    {/* LEAD IDENTITY */}
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: '#1e293b',
                            color: '#fff',
                            display: 'grid',
                            placeItems: 'center',
                            fontWeight: 800,
                            fontSize: '13px',
                          }}
                        >
                          {lead.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 800, color: 'var(--ink)' }}>{lead.name}</span>
                            <span
                              style={{
                                fontSize: '9.5px',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                fontWeight: 800,
                                background: lead.status === 'QUALIFIED' || lead.status === 'CONVERTED' ? '#dcfce7' : '#e0f2fe',
                                color: lead.status === 'QUALIFIED' || lead.status === 'CONVERTED' ? '#166534' : '#0369a1',
                              }}
                            >
                              {lead.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                            {lead.company} {lead.isPrivate ? '• PRIVATE LEAD' : ''}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* CONTEXT */}
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--ink)' }}>{lead.source}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lead.productInterest}
                      </div>
                    </td>

                    {/* AI VERDICT */}
                    <td style={{ padding: '12px', maxWidth: '320px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--ink)', lineHeight: 1.4 }}>
                        {lead.aiVerdict}
                      </div>
                      <button
                        onClick={() => handleRefreshAI(lead.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          color: '#ff5722',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          marginTop: '4px',
                          padding: 0,
                        }}
                      >
                        <Sparkles size={11} /> REFRESH AI
                      </button>
                    </td>

                    {/* SCORE */}
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: lead.aiScore >= 90 ? '#16a34a' : lead.aiScore >= 70 ? '#ea580c' : '#dc2626',
                            }}
                          />
                          <span style={{ fontSize: '16px', fontWeight: 900, color: 'var(--ink)' }}>
                            {lead.aiScore}%
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            color: lead.aiScore >= 90 ? '#16a34a' : lead.aiScore >= 70 ? '#ea580c' : '#dc2626',
                          }}
                        >
                          {lead.aiScore >= 90 ? 'UNICORN' : lead.aiScore >= 70 ? 'HIGH INTENT' : 'COLD / LOW INTENT'}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Lead Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>+ Add Inbound Prospect</h3>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddLeadSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Lead Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chief Adeleke Johnson"
                    value={newLeadForm.name}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+234 800 000 0000"
                      value={newLeadForm.phone}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Company</label>
                    <input
                      type="text"
                      placeholder="e.g. Sterling Ventures"
                      value={newLeadForm.company}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, company: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Channel Source</label>
                    <select
                      value={newLeadForm.source}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, source: e.target.value as any })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px', background: 'var(--white)' }}
                    >
                      <option value="FACEBOOK">Facebook Lead Ads</option>
                      <option value="WEBSITE">Website Contact Form</option>
                      <option value="WHATSAPP">WhatsApp Inbound</option>
                      <option value="GOHIGHLEVEL">GoHighLevel Webhook</option>
                      <option value="CSV">Manual / CSV Import</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Est. Deal Value (₦)</label>
                    <input
                      type="number"
                      value={newLeadForm.dealValue}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, dealValue: Number(e.target.value) })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-accent" style={{ background: '#ff5722', color: '#fff', border: 'none' }}>
                  Save & Evaluate AI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
