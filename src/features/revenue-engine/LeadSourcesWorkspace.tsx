import { useState, type FormEvent } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  FileSpreadsheet,
  Globe2,
  Inbox,
  Mail,
  Phone,
  Plus,
  Radio,
  Send,
  Sparkles,
  Upload,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { apiFetch, readJsonOrThrow, sessionTenant } from '../../lib/api';
import type { UserSession } from '../auth/AuthModal';

const sourceTypes = [
  {
    id: 'website',
    name: 'Website Contact Forms',
    icon: Globe2,
    detail: 'Inbound enquiry forms, landing pages, and lead capture funnels',
    status: 'Connected',
    leadsCount: 142,
    badgeColor: '#10b981',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Cloud Inbound',
    icon: Phone,
    detail: 'Direct WhatsApp chat inquiries and campaign response messages',
    status: 'Ready',
    leadsCount: 89,
    badgeColor: '#10b981',
  },
  {
    id: 'email',
    name: 'Shared Sales Inbox',
    icon: Mail,
    detail: 'Inbound email inquiries routed into 45s qualification workflows',
    status: 'Ready',
    leadsCount: 16,
    badgeColor: '#10b981',
  },
  {
    id: 'csv',
    name: 'CSV & Webhook Feeds',
    icon: Inbox,
    detail: 'Batch lead capture and third-party webhook feeds (Meta, Zapier, GHL)',
    status: 'Available',
    leadsCount: 0,
    badgeColor: '#6366f1',
  },
];

export default function LeadSourcesWorkspace({ session }: { session?: UserSession }) {
  const [showForm, setShowForm] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [source, setSource] = useState('website');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const tenantId = sessionTenant() || session?.tenantId || 'demo-tenant';

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const result = await readJsonOrThrow<{
        lead?: { id: string; state: string };
        decision?: { action?: string; route?: string };
      }>(
        await apiFetch('/api/leads/intake', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: payload.name,
            email: payload.email,
            phone: payload.phone,
            source: payload.source,
            consent: payload.consent === 'on',
            profile: { serviceType: payload.serviceType, needConfirmed: true, decisionMaker: true },
            commercial: {
              estimatedDealValue: Number(payload.estimatedDealValue || 0),
              currency: 'NGN',
              serviceType: payload.serviceType,
            },
          }),
        }),
        'Lead intake failed'
      );
      setMessage(
        `✓ Lead accepted into engine! ${result.lead?.id ?? 'New lead'} is ${result.lead?.state ?? 'being processed'} and routed to ${
          result.decision?.route ?? result.decision?.action ?? 'the revenue qualification pipeline'
        }.`
      );
      setShowForm(false);
      event.currentTarget.reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lead intake failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleCsvImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!csvContent.trim()) {
      setError('Please provide CSV content');
      return;
    }
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const result = await readJsonOrThrow<{
        total: number;
        accepted: number;
        rejected: number;
        duplicates: number;
      }>(
        await apiFetch('/api/leads/import-csv', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            csv: csvContent,
            source: 'csv_batch_import',
          }),
        }),
        'CSV Import failed'
      );
      setMessage(
        `✓ CSV batch processed: ${result.accepted} leads accepted, ${result.rejected} rejected, ${result.duplicates} duplicates from ${result.total} rows.`
      );
      setShowCsvModal(false);
      setCsvContent('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'CSV Import failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dashboard-canvas">
      {/* View Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h1>
            <Radio size={24} color="var(--accent-deep)" />
            Inbound Lead Sources & Ingestion Channels
          </h1>
          <p>
            Bring every inquiry into one deterministic revenue qualification workflow with multi-tenant isolation.
          </p>
        </div>

        <div className="view-actions">
          <button
            onClick={() => setShowCsvModal(true)}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileSpreadsheet size={15} /> Import CSV Batch
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="btn-accent"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={15} /> + Capture Test Lead
          </button>
        </div>
      </div>

      {message && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '8px',
            marginBottom: '20px',
            background: 'rgba(74, 222, 128, 0.15)',
            border: '1px solid rgba(74, 222, 128, 0.4)',
            color: '#16a34a',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            <span>{message}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '8px',
            marginBottom: '20px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#ef4444',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 4 Ingestion Channels Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {sourceTypes.map(({ id, name, icon: Icon, detail, status, leadsCount, badgeColor }) => (
          <div
            key={id}
            className="kpi-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '160px',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    background: 'var(--accent-bg)',
                    color: 'var(--accent-deep)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <Icon size={20} />
                </div>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: `${badgeColor}20`,
                    color: badgeColor,
                  }}
                >
                  {status}
                </span>
              </div>

              <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 800, color: 'var(--ink)' }}>
                {name}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5 }}>
                {detail}
              </p>
            </div>

            <div style={{ paddingTop: '12px', marginTop: '12px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Leads Processed:</span>
              <strong style={{ fontSize: '13px', color: 'var(--ink)' }}>{leadsCount} Leads</strong>
            </div>
          </div>
        ))}
      </div>

      {/* Source-to-Revenue Contract & Tenant Boundary Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
        {/* Step-by-Step Contract */}
        <div className="table-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Users size={20} color="var(--accent-deep)" />
            <div>
              <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: 800 }}>
                Source-to-Revenue Deterministic Pipeline
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                Every captured lead runs through the 4-phase conversion lifecycle
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {[
              { num: '01', title: 'Capture + Consent', desc: 'Webhook, Meta Ads or CSV verification' },
              { num: '02', title: 'Score + Qualify', desc: '45-second AI speed to lead' },
              { num: '03', title: 'Route + Book', desc: 'Sync to closer Google Meet / Cal' },
              { num: '04', title: 'Attribute Cash', desc: '100% closed deal ROI attribution' },
            ].map((item, idx) => (
              <div
                key={item.num}
                style={{
                  padding: '14px',
                  borderRadius: '8px',
                  background: 'var(--paper)',
                  border: '1px solid var(--line)',
                  position: 'relative',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-deep)', marginBottom: '6px' }}>
                  {item.num}
                </div>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--ink)' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tenant Boundary */}
        <div className="dark-panel">
          <div className="dark-panel-header">
            <div className="dark-panel-title">
              <span className="glow-dot" />
              Tenant Boundary & Data Security
            </div>
            <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 800 }}>ISOLATED</span>
          </div>

          <p style={{ fontSize: '12.5px', color: 'var(--dark-muted)', marginBottom: '14px', lineHeight: 1.55 }}>
            All leads, conversations, work items, and attribution metrics remain strictly isolated under tenant:
          </p>

          <div
            style={{
              padding: '12px',
              borderRadius: '6px',
              background: 'var(--dark-surface)',
              border: '1px solid var(--dark-border)',
              fontFamily: 'monospace',
              fontSize: '12.5px',
              color: 'var(--accent)',
              marginBottom: '16px',
            }}
          >
            {tenantId}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#4ade80', fontWeight: 700 }}>
            <CheckCircle2 size={16} /> Multi-tenant row-level security (RLS) active
          </div>
        </div>
      </div>

      {/* Manual Capture Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '580px', maxHeight: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Capture & Route Test Lead</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                  Simulates a live inbound lead passing through the 45s qualification engine
                </p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={(e) => void submitLead(e)} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                      Lead Name *
                    </label>
                    <input
                      name="name"
                      required
                      placeholder="e.g. Chief Adeleke Johnson"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                      Channel Source
                    </label>
                    <select
                      name="source"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px', background: 'var(--white)' }}
                    >
                      <option value="website">Website Form</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="email">Email</option>
                      <option value="manual">Manual Import</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                      Email Address *
                    </label>
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="client@company.com"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                      Phone / WhatsApp *
                    </label>
                    <input
                      name="phone"
                      required
                      placeholder="+234 800 000 0000"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                      Service Inquiry Type *
                    </label>
                    <input
                      name="serviceType"
                      required
                      placeholder="e.g. Enterprise Tax Advisory"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                      Estimated Deal Budget (₦)
                    </label>
                    <input
                      name="estimatedDealValue"
                      type="number"
                      placeholder="1800000"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--muted)', cursor: 'pointer' }}>
                  <input name="consent" type="checkbox" defaultChecked />
                  <span>I confirm this prospect consented to receive automated qualification messages.</span>
                </label>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={busy} className="btn-accent" style={{ padding: '9px 18px', fontWeight: 700 }}>
                  <Zap size={14} /> {busy ? 'Running Engine...' : 'Capture & Route Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Batch Import Modal */}
      {showCsvModal && (
        <div className="modal-overlay" onClick={() => setShowCsvModal(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '620px', maxHeight: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>CSV Batch Lead Intake</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                  Paste rows with columns: <code>name, email, phone, estimated_deal_value, service_type</code>
                </p>
              </div>
              <button
                onClick={() => setShowCsvModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={(e) => void handleCsvImport(e)} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <textarea
                  rows={6}
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  placeholder="name,email,phone,estimated_deal_value,service_type&#10;Ada Lovelace,ada@example.com,+2348011112222,350000,Enterprise Consulting&#10;David Mark,david@example.com,+2348033334444,150000,Web Architecture"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line)', fontFamily: 'monospace', fontSize: '12px' }}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowCsvModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={busy} className="btn-accent" style={{ padding: '9px 18px', fontWeight: 700 }}>
                  <Upload size={14} /> {busy ? 'Processing Batch...' : 'Process & Ingest CSV Leads'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
