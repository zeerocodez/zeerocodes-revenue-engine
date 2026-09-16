import { useEffect, useState } from 'react';
import { ArrowUpRight, CheckCircle2, DollarSign, Flame, RefreshCw, ShieldAlert, TrendingUp } from 'lucide-react';
import type { RecoveryAttribution } from '../../domain/recovery-attribution';
import type { RevenueLeakageOpportunity } from '../../domain/revenue-leakage';
import { apiFetch } from '../../lib/api';

export default function RevenueAttributionWorkspace() {
  const [attributions, setAttributions] = useState<RecoveryAttribution[]>([]);
  const [leakages, setLeakages] = useState<RevenueLeakageOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [scanMessage, setScanMessage] = useState('');

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [attrRes, leakRes] = await Promise.all([
        apiFetch('/api/revenue/recovery/attributions'),
        apiFetch('/api/revenue/leakage'),
      ]);

      if (attrRes.ok) {
        const data = await attrRes.json();
        setAttributions(data.attributions || []);
      }
      if (leakRes.ok) {
        const data = await leakRes.json();
        setLeakages(data.leakages || []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function scanLeakage() {
    setScanning(true);
    setScanMessage('');
    setError('');
    try {
      const res = await apiFetch('/api/revenue/leakage/detect', { method: 'POST' });
      if (!res.ok) throw new Error((await res.json()).error || 'Leakage detection failed');
      const data = await res.json();
      setScanMessage(
        `Scanned ${data.scannedLeads} leads. Detected ${data.detectedLeakages?.length || 0} active leakage opportunities (₦${(data.totalRecoverableRevenue || 0).toLocaleString()} recoverable).`,
      );
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  }

  const totalRecovered = attributions.reduce((sum, a) => sum + a.recoveredAmount, 0);
  const totalLeakageValue = leakages.reduce((sum, l) => sum + l.estimatedRecoverableRevenue, 0);
  const avgRecoveryRate =
    attributions.length > 0
      ? Math.round((attributions.reduce((sum, a) => sum + a.recoveryRate, 0) / attributions.length) * 100) / 100
      : 0;

  if (loading && attributions.length === 0 && leakages.length === 0) {
    return <div className="card p-8 text-sm muted">Loading revenue & recovery attributions…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Revenue & Recovery Attribution</h2>
          <p className="text-xs text-slate-400">
            Measure recovered revenue, leakage detection, and financial attribution ROI.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            disabled={scanning}
            onClick={() => void scanLeakage()}
            className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-400 disabled:opacity-50"
          >
            <Flame size={14} className={scanning ? 'animate-pulse' : ''} />
            {scanning ? 'Scanning Pipeline…' : 'Scan Revenue Leaks'}
          </button>
          <button
            onClick={() => void loadData()}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold hover:bg-slate-700"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">{error}</div>}
      {scanMessage && <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-sm text-indigo-300">{scanMessage}</div>}

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-5">
          <div className="mb-3 w-fit rounded-xl bg-emerald-500/10 p-2.5 text-emerald-300">
            <DollarSign size={20} />
          </div>
          <div className="text-xs text-slate-400">Total Revenue Recovered</div>
          <div className="mt-1 text-2xl font-bold text-white">₦{totalRecovered.toLocaleString()}</div>
        </div>

        <div className="card p-5">
          <div className="mb-3 w-fit rounded-xl bg-amber-500/10 p-2.5 text-amber-300">
            <ShieldAlert size={20} />
          </div>
          <div className="text-xs text-slate-400">Active Leakage at Risk</div>
          <div className="mt-1 text-2xl font-bold text-white">₦{totalLeakageValue.toLocaleString()}</div>
        </div>

        <div className="card p-5">
          <div className="mb-3 w-fit rounded-xl bg-indigo-500/10 p-2.5 text-indigo-300">
            <TrendingUp size={20} />
          </div>
          <div className="text-xs text-slate-400">Average Recovery Rate</div>
          <div className="mt-1 text-2xl font-bold text-white">{avgRecoveryRate}%</div>
        </div>

        <div className="card p-5">
          <div className="mb-3 w-fit rounded-xl bg-purple-500/10 p-2.5 text-purple-300">
            <CheckCircle2 size={20} />
          </div>
          <div className="text-xs text-slate-400">Recovered Win Events</div>
          <div className="mt-1 text-2xl font-bold text-white">{attributions.length}</div>
        </div>
      </div>

      {/* Recovery Attributions Table */}
      <section className="card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-sm text-white">Recovered Revenue Attributions</h3>
          <span className="text-xs text-slate-500">Immutable Evidence Log</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="pb-3 font-semibold">Lead ID</th>
                <th className="pb-3 font-semibold">Leakage Type</th>
                <th className="pb-3 font-semibold">Recovered Amount</th>
                <th className="pb-3 font-semibold">Leakage Value</th>
                <th className="pb-3 font-semibold">Recovery Rate</th>
                <th className="pb-3 font-semibold">Owner</th>
                <th className="pb-3 font-semibold">Evidence</th>
                <th className="pb-3 font-semibold">Recovered At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {attributions.map((item) => (
                <tr key={item.id} className="hover:bg-slate-900/40">
                  <td className="py-3 font-medium text-slate-200">{item.leadId}</td>
                  <td className="py-3 capitalize text-slate-400">{item.leakageType}</td>
                  <td className="py-3 font-bold text-emerald-400">₦{item.recoveredAmount.toLocaleString()}</td>
                  <td className="py-3 text-slate-400">₦{item.leakageValue.toLocaleString()}</td>
                  <td className="py-3 font-semibold text-indigo-300">{item.recoveryRate}%</td>
                  <td className="py-3 text-slate-300">{item.ownerId}</td>
                  <td className="py-3">
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                      {item.evidence}
                    </span>
                  </td>
                  <td className="py-3 text-slate-500">{new Date(item.recoveredAt).toLocaleString()}</td>
                </tr>
              ))}
              {attributions.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-sm muted">
                    No recovery attributions recorded yet. Complete WON recovery actions from the SDR Queue!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Active Leakage Opportunities Table */}
      <section className="card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-sm text-white">Active Revenue Leakage Opportunities ({leakages.length})</h3>
          <span className="text-xs text-slate-500">Pipeline Risk Analysis</span>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {leakages.map((leak) => (
            <div key={leak.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">{leak.leadName}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    leak.severity === 'critical'
                      ? 'bg-red-500/20 text-red-300'
                      : leak.severity === 'high'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {leak.severity}
                </span>
              </div>
              <div className="text-xs text-slate-400">{leak.reason}</div>
              <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-xs">
                <span className="text-emerald-400 font-bold">₦{leak.estimatedRecoverableRevenue.toLocaleString()}</span>
                <span className="text-[11px] text-indigo-300 flex items-center gap-1">
                  {leak.recommendedAction} <ArrowUpRight size={11} />
                </span>
              </div>
            </div>
          ))}
          {leakages.length === 0 && (
            <div className="col-span-full py-8 text-center text-sm muted">
              No active revenue leaks detected. Click "Scan Revenue Leaks" to evaluate the pipeline.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
