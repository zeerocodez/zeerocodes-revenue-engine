import { useEffect, useState, type ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  CircleDollarSign,
  Flame,
  GitBranch,
  Inbox,
  LayoutDashboard,
  RefreshCw,
  Settings2,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import LeadWorkspace from './features/revenue-engine/LeadWorkspace';
import SdrQueueWorkspace from './features/revenue-engine/SdrQueueWorkspace';
import RevenueAttributionWorkspace from './features/revenue-engine/RevenueAttributionWorkspace';
import SettingsWorkspace from './features/revenue-engine/SettingsWorkspace';
import type { RevenueControlPlaneSnapshot } from './domain/revenue-control-plane';
import { apiFetch, sessionTenant } from './lib/api';

const nav = [
  ['Overview', LayoutDashboard],
  ['Leads', Inbox],
  ['SDR Queue', GitBranch],
  ['Revenue', CircleDollarSign],
  ['Settings', Settings2],
] as const;

export default function App() {
  const [active, setActive] = useState<string>('Overview');
  const [control, setControl] = useState<RevenueControlPlaneSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const tenantId = sessionTenant() || 'demo-tenant';

  async function loadControlPlane() {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/revenue/control-plane');
      if (!res.ok) throw new Error((await res.json()).error || 'Unable to load revenue control plane');
      const data = await res.json();
      setControl(data.controlPlane);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading control plane');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadControlPlane();
  }, []);

  return (
    <div className="min-h-screen bg-[#080b14] text-slate-100">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-800 bg-[#0b0f1a] p-5 lg:block">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500 font-black shadow-lg shadow-indigo-500/20">
            Z
          </div>
          <div>
            <div className="font-bold">Zeerocodes</div>
            <div className="text-xs text-indigo-400">Revenue Engine</div>
          </div>
        </div>

        <nav className="space-y-1">
          {nav.map(([label, Icon]) => (
            <button
              key={label}
              onClick={() => setActive(label)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active === label
                  ? 'bg-indigo-500/15 text-indigo-300 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
            <CheckCircle2 size={16} /> Engine Operational
          </div>
          <div className="mt-1 text-xs text-slate-500">
            RLS active · Tenant: <span className="text-slate-400">{tenantId}</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="lg:pl-64">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-[#080b14]/90 px-5 py-4 backdrop-blur md:px-8">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-indigo-300 font-semibold">
              Zeerocodes Revenue Operating System
            </div>
            <h1 className="mt-1 text-xl font-bold">{active}</h1>
          </div>

          <div className="flex items-center gap-3">
            {control && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  control.status === 'intervene'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : control.status === 'watch'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                Control: {control.status}
              </span>
            )}
            <div className="flex items-center gap-2 rounded-full border border-slate-800 px-3 py-1.5 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Backend
            </div>
          </div>
        </header>

        <section className="space-y-6 p-5 md:p-8">
          {active === 'Overview' && (
            <Overview
              control={control}
              loading={loading}
              error={error}
              onRefresh={loadControlPlane}
              onOpenSdrQueue={() => setActive('SDR Queue')}
              onOpenLeads={() => setActive('Leads')}
            />
          )}

          {active === 'Leads' && <LeadWorkspace />}

          {active === 'SDR Queue' && <SdrQueueWorkspace />}

          {active === 'Revenue' && <RevenueAttributionWorkspace />}

          {active === 'Settings' && <SettingsWorkspace />}
        </section>
      </main>
    </div>
  );
}

function Overview({
  control,
  loading,
  error,
  onRefresh,
  onOpenSdrQueue,
  onOpenLeads,
}: {
  control: RevenueControlPlaneSnapshot | null;
  loading: boolean;
  error: string;
  onRefresh: () => Promise<void>;
  onOpenSdrQueue: () => void;
  onOpenLeads: () => void;
}) {
  if (loading && !control) {
    return <div className="card p-8 text-sm muted">Connecting to live revenue control plane…</div>;
  }

  if (error && !control) {
    return (
      <div className="card p-8 text-sm text-rose-300 space-y-3">
        <div>Error connecting to revenue control plane: {error}</div>
        <button
          onClick={() => void onRefresh()}
          className="rounded-xl bg-indigo-500 px-4 py-2 text-xs font-semibold text-white"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const revenue = control?.revenue ?? 0;
  const recovered = control?.revenueRecovered ?? 0;
  const recoverable = control?.estimatedRecoverableRevenue ?? 0;
  const criticalItems = control?.criticalOpenWorkItems ?? 0;
  const slaBreaches = control?.slaBreaches ?? 0;
  const status = control?.status ?? 'clear';
  const actions = control?.actions ?? [];

  return (
    <>
      {/* Live Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={<CircleDollarSign size={20} />}
          label="Total Revenue Won"
          value={`₦${revenue.toLocaleString()}`}
          trend="Live database record"
        />
        <Metric
          icon={<TrendingUp size={20} />}
          label="Revenue Recovered"
          value={`₦${recovered.toLocaleString()}`}
          trend="Attributed from leaks"
        />
        <Metric
          icon={<Flame size={20} />}
          label="Pipeline at Risk (Leaks)"
          value={`₦${recoverable.toLocaleString()}`}
          trend={`${control?.revenueLeakCount ?? 0} active opportunities`}
        />
        <Metric
          icon={<ShieldCheck size={20} />}
          label="Operating Status"
          value={status.toUpperCase()}
          trend={
            status === 'intervene'
              ? 'Exceptions require intervention'
              : status === 'watch'
                ? 'Active queue items'
                : 'All SLA targets met'
          }
        />
      </div>

      {/* Control Plane Hero + Management Actions */}
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-indigo-300 font-semibold">
                  Revenue Control Plane
                </div>
                <h2 className="mt-2 text-2xl font-bold text-white">
                  Run revenue from exceptions, not spreadsheets.
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  The engine turns funnel leakage, SLA breaches, and SDR execution into prioritized,
                  transaction-safe operational actions.
                </p>
              </div>
              <button
                onClick={() => void onRefresh()}
                className="rounded-xl border border-slate-700 bg-slate-800/60 p-2.5 text-slate-300 hover:bg-slate-700"
                title="Refresh Live Data"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <MiniMetric label="SLA Breaches" value={String(slaBreaches)} alert={slaBreaches > 0} />
              <MiniMetric label="Critical Work" value={String(criticalItems)} alert={criticalItems > 0} />
              <MiniMetric label="Recovery Rate" value={`${control?.recoveryRate ?? 0}%`} />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenSdrQueue}
              className="flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-400 transition"
            >
              Open SDR Queue <ArrowRight size={15} />
            </button>
            <button
              onClick={onOpenLeads}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition"
            >
              Lead Workspace
            </button>
          </div>
        </section>

        {/* Priority Management Actions */}
        <section className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-base text-white">Management Action Queue</h3>
            <span className="text-xs text-slate-400">{actions.length} items</span>
          </div>

          <div className="space-y-3">
            {actions.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5 space-y-1.5"
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle
                    size={16}
                    className={
                      item.severity === 'critical'
                        ? 'text-red-400 shrink-0 mt-0.5'
                        : item.severity === 'high'
                          ? 'text-amber-400 shrink-0 mt-0.5'
                          : 'text-slate-400 shrink-0 mt-0.5'
                    }
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-200">{item.title}</div>
                    <div className="text-[11px] text-slate-400">{item.reason}</div>
                    <div className="mt-1 text-[11px] font-medium text-indigo-300">
                      Next: {item.recommendedAction}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {actions.length === 0 && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center text-sm text-emerald-300">
                <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-400" />
                No exceptions require management intervention.
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function MiniMetric({ label, value, alert = false }: { label: string; value: string; alert?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-3.5 ${
        alert
          ? 'border-rose-500/30 bg-rose-500/10'
          : 'border-slate-800 bg-slate-900/50'
      }`}
    >
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`mt-1 text-lg font-bold ${alert ? 'text-rose-300' : 'text-white'}`}>{value}</div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  trend,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <div className="card p-5">
      <div className="mb-3 w-fit rounded-xl bg-indigo-500/10 p-2.5 text-indigo-300">{icon}</div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-bold text-white">{value}</div>
      <div className="mt-2 text-[11px] text-slate-500">{trend}</div>
    </div>
  );
}
