import { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Clock, DollarSign, FileText, Phone, RefreshCw, ShieldCheck, User } from 'lucide-react';
import type { SdrWorkItem, SdrDisposition } from '../../domain/sdr-work-item';
import { apiFetch } from '../../lib/api';

export default function SdrQueueWorkspace() {
  const [items, setItems] = useState<SdrWorkItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<SdrWorkItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  // Disposition / Recovery Form state
  const [selectedDisposition, setSelectedDisposition] = useState<SdrDisposition>('connected');
  const [appointmentId, setAppointmentId] = useState('');
  const [appointmentStatus, setAppointmentStatus] = useState<'scheduled' | 'confirmed'>('scheduled');
  const [recoveryAmount, setRecoveryAmount] = useState('');
  const [notes, setNotes] = useState('');

  async function loadQueue() {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/sdr/queue');
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to load SDR queue');
      const data = await res.json();
      setItems(data.items || []);
      if (selectedItem) {
        const refreshed = (data.items || []).find((i: SdrWorkItem) => i.id === selectedItem.id);
        if (refreshed) setSelectedItem(refreshed);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading queue');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadQueue();
  }, []);

  async function claimItem(item: SdrWorkItem) {
    setActionLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/api/sdr/work-items/${encodeURIComponent(item.id)}/claim`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Claim failed');
      const data = await res.json();
      setSelectedItem(data.workItem);
      await loadQueue();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Claim failed');
    } finally {
      setActionLoading(false);
    }
  }

  async function applyDisposition() {
    if (!selectedItem) return;
    setActionLoading(true);
    setError('');
    setActionSuccess('');

    try {
      if (selectedDisposition === 'won') {
        // Execute revenue recovery
        const amt = Number(recoveryAmount || selectedItem.estimatedRecoverableRevenue || 0);
        if (!amt || amt <= 0) throw new Error('Please enter a valid positive recovered revenue amount');

        const res = await apiFetch('/api/revenue/recovery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workItemId: selectedItem.id,
            recoveredAmount: amt,
            notes,
          }),
        });

        if (!res.ok) throw new Error((await res.json()).error || 'Recovery execution failed');
        setActionSuccess(`Successfully recovered ₦${amt.toLocaleString()} revenue!`);
      } else {
        const payload: any = { disposition: selectedDisposition };
        if (selectedDisposition === 'appointment-booked') {
          if (!appointmentId.trim()) throw new Error('Appointment ID is required for appointment-booked');
          payload.appointmentId = appointmentId.trim();
          payload.appointmentStatus = appointmentStatus;
        }

        const res = await apiFetch(`/api/sdr/work-items/${encodeURIComponent(selectedItem.id)}/disposition`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error((await res.json()).error || 'Disposition failed');
        setActionSuccess(`Applied disposition: ${selectedDisposition}`);
      }

      await loadQueue();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading && items.length === 0) {
    return <div className="card p-8 text-sm muted">Loading SDR work queue…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">SDR Revenue & Recovery Queue</h2>
          <p className="text-xs text-slate-400">
            Prioritized work items with AI scripts, objection handling, and transaction-safe revenue recovery.
          </p>
        </div>
        <button
          onClick={() => void loadQueue()}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold hover:bg-slate-700"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Queue
        </button>
      </div>

      {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">{error}</div>}
      {actionSuccess && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">{actionSuccess}</div>}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* Work Item List */}
        <section className="card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="font-semibold text-sm">Active Work Items ({items.length})</span>
            <span className="text-xs text-slate-500">Sorted by Priority & SLA</span>
          </div>

          <div className="space-y-3">
            {items.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              const isBreached = item.slaBreached || Date.parse(item.deadlineAt) < Date.now();
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`cursor-pointer rounded-2xl border p-4 transition ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{item.leadName}</span>
                        <BandBadge band={item.priorityBand} />
                        <StatusBadge status={item.status} />
                        {isBreached && (
                          <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-300">
                            <AlertTriangle size={11} /> SLA Breached
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 text-xs text-slate-400">{item.whyNow}</div>
                      {item.estimatedRecoverableRevenue ? (
                        <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-400">
                          <DollarSign size={13} /> Recoverable: ₦{item.estimatedRecoverableRevenue.toLocaleString()} ({item.leakageType})
                        </div>
                      ) : null}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs text-slate-500">Score: {item.priorityScore}</div>
                      <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock size={11} />
                        Due: {new Date(item.deadlineAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-800/60 pt-3">
                    <span className="text-[11px] text-indigo-300 font-medium">Next: {item.recommendedAction}</span>
                    {item.status === 'open' && (
                      <button
                        disabled={actionLoading}
                        onClick={(e) => {
                          e.stopPropagation();
                          void claimItem(item);
                        }}
                        className="rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
                      >
                        Claim Work
                      </button>
                    )}
                    {item.status === 'claimed' && (
                      <span className="text-[11px] text-amber-300 flex items-center gap-1">
                        <User size={12} /> Claimed {item.ownerId ? `(${item.ownerId})` : ''}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {items.length === 0 && (
              <div className="p-8 text-center text-sm muted">
                <CheckCircle size={28} className="mx-auto text-emerald-400 mb-2" />
                No active SDR items in queue. All opportunities are up to date!
              </div>
            )}
          </div>
        </section>

        {/* Work Item Detail & Script & Disposition */}
        <section className="card p-5 space-y-6">
          {selectedItem ? (
            <>
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-indigo-300">Work Item Details</div>
                  <h3 className="mt-1 text-lg font-bold text-white">{selectedItem.leadName}</h3>
                  <div className="mt-1 text-xs text-slate-400">
                    Lead State: <span className="font-semibold text-slate-200 capitalize">{selectedItem.leadState}</span>
                  </div>
                </div>
                {selectedItem.status === 'open' ? (
                  <button
                    disabled={actionLoading}
                    onClick={() => void claimItem(selectedItem)}
                    className="rounded-xl bg-indigo-500 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-400"
                  >
                    Claim This Lead
                  </button>
                ) : (
                  <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                    Claimed & Active
                  </span>
                )}
              </div>

              {/* Script Pack */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                  <FileText size={16} className="text-indigo-400" /> AI Operating Script
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Opening</div>
                  <p className="text-xs text-slate-300 italic">"{selectedItem.script?.opening}"</p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Qualification Questions</div>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                    {selectedItem.script?.qualificationQuestions?.map((q, idx) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Objection Handling</div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {selectedItem.script?.objectionResponses?.map((r, idx) => (
                      <li key={idx} className="border-l-2 border-indigo-500/50 pl-2 italic">
                        "{r}"
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Disposition / Recovery Action Panel */}
              <div className="border-t border-slate-800 pt-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                  <ShieldCheck size={16} className="text-emerald-400" /> Apply Disposition & Outcome
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-400">Select Disposition</label>
                    <select
                      value={selectedDisposition}
                      onChange={(e) => setSelectedDisposition(e.target.value as SdrDisposition)}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-100"
                    >
                      {selectedItem.dispositionOptions?.map((disp) => (
                        <option key={disp} value={disp}>
                          {disp}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedDisposition === 'appointment-booked' && (
                    <div className="space-y-2 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3">
                      <label className="text-xs font-medium text-indigo-300">Appointment ID</label>
                      <input
                        value={appointmentId}
                        onChange={(e) => setAppointmentId(e.target.value)}
                        placeholder="e.g. apt_12345"
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs"
                      />
                      <label className="text-xs font-medium text-indigo-300 mt-2 block">Appointment Status</label>
                      <select
                        value={appointmentStatus}
                        onChange={(e) => setAppointmentStatus(e.target.value as any)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs"
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="confirmed">Confirmed</option>
                      </select>
                    </div>
                  )}

                  {selectedDisposition === 'won' && (
                    <div className="space-y-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
                      <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                        <DollarSign size={14} /> Revenue Recovery Execution
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Recording WON will transition lead lifecycle, create auditable revenue attribution, and calculate recovery ROI.
                      </p>
                      <label className="text-xs font-medium text-slate-300 block mt-2">Recovered Revenue (NGN)</label>
                      <input
                        type="number"
                        value={recoveryAmount}
                        onChange={(e) => setRecoveryAmount(e.target.value)}
                        placeholder={String(selectedItem.estimatedRecoverableRevenue || 250000)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs font-bold text-emerald-400"
                      />
                      <label className="text-xs font-medium text-slate-300 block mt-2">Recovery Notes</label>
                      <input
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. Closed annual agreement via callback"
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs"
                      />
                    </div>
                  )}

                  <button
                    disabled={actionLoading}
                    onClick={() => void applyDisposition()}
                    className={`w-full rounded-xl py-3 text-xs font-bold transition ${
                      selectedDisposition === 'won'
                        ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                        : 'bg-indigo-500 text-white hover:bg-indigo-400'
                    } disabled:opacity-50`}
                  >
                    {actionLoading
                      ? 'Processing…'
                      : selectedDisposition === 'won'
                        ? 'Execute Revenue Recovery (WON)'
                        : `Apply Disposition: ${selectedDisposition}`}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-sm muted">
              <AlertCircle size={32} className="mx-auto text-slate-600 mb-2" />
              Select a work item from the queue to review scripts and apply dispositions.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function BandBadge({ band }: { band: string }) {
  const tone =
    band === 'critical'
      ? 'bg-red-500/20 text-red-300 border-red-500/30'
      : band === 'high'
        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        : 'bg-slate-800 text-slate-400 border-slate-700';
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${tone}`}>{band}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'claimed'
      ? 'bg-indigo-500/20 text-indigo-300'
      : status === 'completed'
        ? 'bg-emerald-500/20 text-emerald-300'
        : 'bg-slate-800 text-slate-400';
  return <span className={`rounded-full px-2 py-0.5 text-[10px] capitalize font-medium ${tone}`}>{status}</span>;
}
