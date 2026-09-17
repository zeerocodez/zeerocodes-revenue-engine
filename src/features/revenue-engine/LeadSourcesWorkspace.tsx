import { useState, type FormEvent } from 'react';
import { CheckCircle2, ChevronRight, FileSpreadsheet, Globe2, Inbox, Mail, Phone, Plus, Send, Upload, Users, X } from 'lucide-react';
import { apiFetch, readJsonOrThrow, sessionTenant } from '../../lib/api';

import type { UserSession } from '../auth/AuthModal';

const sourceTypes = [
  { name: 'Website forms', icon: Globe2, detail: 'Inbound enquiry forms and landing pages', status: 'Connected' },
  { name: 'WhatsApp', icon: Phone, detail: 'Inbound conversations and campaign replies', status: 'Ready' },
  { name: 'Email', icon: Mail, detail: 'Shared sales inbox and enquiry addresses', status: 'Ready' },
  { name: 'CSV & API import', icon: Inbox, detail: 'Batch lead capture and third-party webhook feeds', status: 'Available' },
];

export default function LeadSourcesWorkspace({ session }: { session?: UserSession }) {
  const [showForm, setShowForm] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [source, setSource] = useState('website');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const tenantId = sessionTenant() || 'demo-tenant';

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
        `Lead accepted. ${result.lead?.id ?? 'New lead'} is ${result.lead?.state ?? 'being processed'} and routed to ${
          result.decision?.route ?? result.decision?.action ?? 'the revenue engine'
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
        `CSV batch processed: ${result.accepted} leads accepted, ${result.rejected} rejected, ${result.duplicates} duplicates from ${result.total} rows.`
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
    <div className="space-y-6">
      <section className="card overflow-hidden">
        <div className="flex flex-col justify-between gap-5 border-b border-slate-800 p-6 md:flex-row md:items-center">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
              Client lead sources
            </div>
            <h2 className="mt-2 text-2xl font-bold text-white">Bring every enquiry into one revenue workflow.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Sources stay attached to tenant <span className="font-semibold text-slate-200">{tenantId}</span>. Every
              captured lead is consent-checked, scored, prioritised and routed by the same deterministic engine.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowCsvModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
            >
              <FileSpreadsheet size={17} /> Import CSV
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
            >
              <Plus size={17} /> Capture a Lead
            </button>
          </div>
        </div>
        <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-4">
          {sourceTypes.map(({ name, icon: Icon, detail, status }) => (
            <div key={name} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
              <div className="flex items-center justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500/10 text-indigo-300">
                  <Icon size={18} />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">{status}</span>
              </div>
              <h3 className="mt-5 text-sm font-bold text-white">{name}</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <Users size={18} className="text-indigo-300" />
            <h3 className="font-bold text-white">Source-to-revenue contract</h3>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-4">
            {['Capture + consent', 'Score + qualify', 'Route + act', 'Attribute outcome'].map((item, index) => (
              <div key={item} className="relative rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <span className="text-[10px] font-bold text-indigo-300">0{index + 1}</span>
                <p className="mt-3 text-xs font-semibold leading-5 text-slate-200">{item}</p>
                {index < 3 && (
                  <ChevronRight className="absolute -right-3 top-7 hidden text-slate-700 md:block" size={17} />
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="card p-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tenant boundary</div>
          <h3 className="mt-2 text-lg font-bold text-white">{tenantId}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            All leads, sources, conversations, work items and attribution remain strictly scoped to this client
            organization.
          </p>
          <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-emerald-300">
            <CheckCircle2 size={15} /> Multi-tenant RLS isolation active
          </div>
        </div>
      </section>

      {message && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
          <div>{message}</div>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
          <X size={18} className="shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Manual Capture Modal */}
      {showForm && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="card max-h-[90vh] w-full max-w-xl overflow-y-auto p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                  Manual lead capture
                </div>
                <h3 className="mt-2 text-xl font-bold text-white">Send a lead through the engine.</h3>
                <p className="mt-2 text-sm text-slate-400">
                  This creates a real lead in the active client tenant and runs qualification and routing.
                </p>
              </div>
              <button
                aria-label="Close"
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={(event) => void submitLead(event)} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-300">
                  Name
                  <input
                    name="name"
                    required
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm text-white"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-300">
                  Source
                  <select
                    name="source"
                    value={source}
                    onChange={(event) => setSource(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm text-white"
                  >
                    <option value="website">Website form</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="manual">Manual import</option>
                  </select>
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-300">
                  Email
                  <input
                    name="email"
                    type="email"
                    required
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm text-white"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-300">
                  Phone / WhatsApp
                  <input
                    name="phone"
                    required
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm text-white"
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-300">
                  Service type
                  <input
                    name="serviceType"
                    required
                    placeholder="e.g. Property advisory"
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm text-white"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-300">
                  Estimated deal value
                  <input
                    name="estimatedDealValue"
                    type="number"
                    min="0"
                    inputMode="decimal"
                    placeholder="₦"
                    className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm text-white"
                  />
                </label>
              </div>
              <label className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-400">
                <input name="consent" type="checkbox" required className="mt-0.5" /> I confirm this lead has consented
                to be contacted through the selected source.
              </label>
              <button
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
                type="submit"
              >
                {busy ? 'Running revenue engine…' : 'Capture and route lead'} <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="card max-h-[90vh] w-full max-w-xl overflow-y-auto p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                  CSV Batch Lead Intake
                </div>
                <h3 className="mt-2 text-xl font-bold text-white">Import leads from spreadsheet.</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Paste CSV lines with columns: <code className="text-indigo-300">name, email, phone, estimated_deal_value, service_type</code>
                </p>
              </div>
              <button
                aria-label="Close"
                onClick={() => setShowCsvModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={(event) => void handleCsvImport(event)} className="mt-6 space-y-4">
              <textarea
                rows={7}
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder="name,email,phone,estimated_deal_value,service_type&#10;Ada Lovelace,ada@example.com,+2348011112222,350000,Enterprise Consulting&#10;David Mark,david@example.com,+2348033334444,150000,Web Architecture"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 font-mono text-xs text-white"
              />
              <button
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
                type="submit"
              >
                {busy ? 'Processing batch…' : 'Process and Import Leads'} <Upload size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
