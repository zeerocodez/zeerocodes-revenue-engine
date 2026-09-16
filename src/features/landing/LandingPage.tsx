import { useState, useMemo, type FormEvent } from 'react';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Cpu,
  Database,
  Flame,
  GitBranch,
  Layers,
  Lock,
  Play,
  RotateCcw,
  Shield,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
  X,
  Send,
  FileSearch,
} from 'lucide-react';
import { apiFetch, readJsonOrThrow } from '../../lib/api';

interface LandingPageProps {
  onLaunchWorkspace: (tab?: string) => void;
}

export default function LandingPage({ onLaunchWorkspace }: LandingPageProps) {
  // Calculator state
  const [monthlyLeads, setMonthlyLeads] = useState<number>(300);
  const [avgDealValue, setAvgDealValue] = useState<number>(150000); // NGN
  const [leakageRate, setLeakageRate] = useState<number>(35); // 35% estimated dropoff

  // Audit Request State
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditBusy, setAuditBusy] = useState(false);
  const [auditSuccess, setAuditSuccess] = useState<string | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  async function handleAuditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuditBusy(true);
    setAuditSuccess(null);
    setAuditError(null);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      await readJsonOrThrow(
        await apiFetch('/api/public/audit-requests', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: payload.name,
            business: payload.business,
            email: payload.email,
            phone: payload.phone,
            website: payload.website || undefined,
            monthlyLeadVolume: payload.monthlyLeadVolume,
            currentCrm: payload.currentCrm || undefined,
            biggestSalesBottleneck: payload.biggestSalesBottleneck,
            averageDealValue: payload.averageDealValue ? Number(payload.averageDealValue) : undefined,
            whereLeadsAreLost: payload.whereLeadsAreLost || undefined,
          }),
        }),
        'Audit submission failed'
      );
      setAuditSuccess('Your revenue audit request has been received! Our senior architecture team will review your funnel.');
      event.currentTarget.reset();
    } catch (e) {
      setAuditError(e instanceof Error ? e.message : 'Audit submission failed');
    } finally {
      setAuditBusy(false);
    }
  }

  const calculation = useMemo(() => {
    const totalPipelineValue = monthlyLeads * avgDealValue;
    const revenueAtRisk = Math.round(totalPipelineValue * (leakageRate / 100));
    const recoverableEstimate = Math.round(revenueAtRisk * 0.45); // Engine recovers ~45% of lost pipeline
    const monthlyEngineFee = 150000;
    const netGains = recoverableEstimate - monthlyEngineFee;
    const estimatedRoi = Math.max(1, Math.round((recoverableEstimate / monthlyEngineFee) * 10) / 10);

    return {
      totalPipelineValue,
      revenueAtRisk,
      recoverableEstimate,
      estimatedRoi,
      netGains,
    };
  }, [monthlyLeads, avgDealValue, leakageRate]);

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#070a13]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 font-black shadow-lg shadow-indigo-500/25">
              Z
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-white">Zeerocodes</div>
              <div className="text-[11px] font-semibold tracking-wider text-indigo-400 uppercase">Revenue Growth Engine</div>
            </div>
          </div>

          <nav className="hidden items-center gap-8 md:flex text-sm font-medium text-slate-300">
            <a href="#operating-chain" className="hover:text-white transition">Operating Chain</a>
            <a href="#leakage-matrix" className="hover:text-white transition">Leakage Recovery</a>
            <a href="#calculator" className="hover:text-white transition">ROI Calculator</a>
            <a href="#architecture" className="hover:text-white transition">Architecture</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAuditModal(true)}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-4 py-2.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition"
            >
              <FileSearch size={14} />
              Request Audit
            </button>
            <button
              onClick={() => onLaunchWorkspace('Overview')}
              className="group flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition"
            >
              Launch Engine
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32">
        {/* Ambient Glows */}
        <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-emerald-500/10 blur-[130px]" />

        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300 backdrop-blur">
            <Sparkles size={13} className="text-indigo-400" />
            Production Revenue Operations Layer · PostgreSQL RLS
          </div>

          <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl">
            Turn Leaking Leads into <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-300 via-indigo-400 to-emerald-300 bg-clip-text text-transparent">
              Captured Revenue.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-slate-300 sm:text-lg">
            The autonomous decision & execution layer that sits above your lead sources, conversations, SDRs, and closers—making revenue leakage visible, actionable, and mathematically attributed.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onLaunchWorkspace('Overview')}
              className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-7 py-4 text-sm font-bold text-white shadow-xl shadow-indigo-500/30 hover:from-indigo-400 hover:to-indigo-500 transition"
            >
              Open Revenue Control Plane <ArrowRight size={16} />
            </button>
            <button
              onClick={() => setShowAuditModal(true)}
              className="flex items-center gap-2 rounded-2xl border border-indigo-500/40 bg-indigo-500/10 px-7 py-4 text-sm font-bold text-indigo-200 hover:bg-indigo-500/20 transition"
            >
              <FileSearch size={16} /> Request Revenue Leak Audit
            </button>
            <button
              onClick={() => onLaunchWorkspace('SDR Queue')}
              className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/80 px-7 py-4 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition"
            >
              Explore SDR Queue
            </button>
          </div>

          {/* Quick Pillar Badges */}
          <div className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['Deterministic Routing', 'Rules-first, AI assists'],
              ['Evidence-Gated Lifecycle', 'Strict Booked → Won proof'],
              ['Leakage Detection', '5 canonical leak engines'],
              ['Multi-Tenant Security', 'PostgreSQL RLS enforced'],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-left">
                <div className="text-xs font-bold text-white">{title}</div>
                <div className="mt-1 text-[11px] text-slate-400">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Operating Chain Section */}
      <section id="operating-chain" className="border-t border-slate-800/80 bg-[#090d1a] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <div className="text-xs font-bold uppercase tracking-widest text-indigo-400">The Revenue Core</div>
            <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
              The 7-Step Operating Chain
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400">
              Every inbound lead flows through strict evidence gates, priority decisioning, and recovery attribution.
            </p>
          </div>

          <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: '01',
                title: 'Lead Intake',
                desc: 'Consolidate leads from WhatsApp, Web Forms, Ads, and CRMs with verified consent.',
                badge: 'Multi-Channel',
                icon: <Users size={20} className="text-indigo-400" />,
              },
              {
                step: '02',
                title: 'Revenue Priority',
                desc: 'Real-time scoring across intent signals, commercial deal value, urgency, and SLA time.',
                badge: 'Multi-Dimensional',
                icon: <TrendingUp size={20} className="text-indigo-400" />,
              },
              {
                step: '03',
                title: 'Decision & NBA',
                desc: 'Deterministic next-best-action routing: automated AI outreach, SDR call-now, or closer handoff.',
                badge: 'Policy-Driven',
                icon: <Bot size={20} className="text-indigo-400" />,
              },
              {
                step: '04',
                title: 'SDR Work Queue',
                desc: 'Atomic work claiming with generated objection scripts, qualification questions, and closing prompts.',
                badge: 'Atomic Locks',
                icon: <GitBranch size={20} className="text-indigo-400" />,
              },
              {
                step: '05',
                title: 'Evidence Lifecycle',
                desc: 'Strict lifecycle transitions. Leads cannot advance to Booked without an appointment ID, or Won without verified revenue.',
                badge: 'Evidence-Gated',
                icon: <ShieldCheck size={20} className="text-emerald-400" />,
              },
              {
                step: '06',
                title: 'Recovery Attribution',
                desc: 'Trace recovered wins directly to identified leakage opportunities with recovery rates capped at 100%.',
                badge: 'Auditable Ledger',
                icon: <CircleDollarSign size={20} className="text-emerald-400" />,
              },
              {
                step: '07',
                title: 'Control Plane',
                desc: 'Live telemetry tracking revenue recovered, pipeline at risk, SLA breaches, and prioritized manager interventions.',
                badge: 'Real-Time Telemetry',
                icon: <Zap size={20} className="text-emerald-400" />,
              },
              {
                step: 'PRO',
                title: 'Instant Execution',
                desc: 'Empower your sales team to act on operational exceptions rather than managing spreadsheets.',
                badge: 'Production Ready',
                icon: <Sparkles size={20} className="text-purple-400" />,
              },
            ].map((card) => (
              <div
                key={card.step}
                className="group relative rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition hover:border-indigo-500/50 hover:bg-slate-900/80"
              >
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-indigo-500/10 p-2.5">{card.icon}</div>
                  <span className="text-xs font-black text-slate-600 group-hover:text-indigo-400 transition">
                    {card.step}
                  </span>
                </div>
                <div className="mt-4">
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                    {card.badge}
                  </span>
                  <h3 className="mt-2 text-base font-bold text-white">{card.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Revenue Leakage Engine Section */}
      <section id="leakage-matrix" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3.5 py-1 text-xs font-semibold text-red-300">
                <Flame size={13} className="text-red-400" /> Continuous Pipeline Scan
              </div>
              <h2 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl">
                5 Canonical Revenue Leaks Detected & Recovered
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">
                Traditional sales operations lose up to 40% of their pipeline to response latency, stalled messaging, and unworked exceptions. The Zeerocodes engine actively detects and surfaces recoverable value.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  'Server-derived financial valuation (no client spoofing)',
                  'Direct linkage between leaks and SDR recovery work items',
                  'Deterministic recovery rate calculations capped at 100%',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs font-medium text-slate-200">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <button
                  onClick={() => onLaunchWorkspace('Revenue')}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-bold text-white hover:bg-indigo-500 transition"
                >
                  View Revenue Attribution Ledger <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Leakage Cards */}
            <div className="space-y-3">
              {[
                {
                  type: 'Uncontacted Leakage',
                  severity: 'Critical',
                  time: '5m SLA breach',
                  desc: 'New high-intent lead received without timely outbound outreach.',
                  action: 'Trigger instant AI SMS/WhatsApp or prioritize SDR call-now.',
                },
                {
                  type: 'Stalled Engagement',
                  severity: 'High',
                  time: '30m idle',
                  desc: 'Lead paused mid-qualification after asking commercial or pricing questions.',
                  action: 'Deploy targeted objection handling and incentive prompt.',
                },
                {
                  type: 'Qualified No-Booking',
                  severity: 'Critical',
                  time: '4h post-qual',
                  desc: 'Fully qualified opportunity that dropped off before booking a calendar slot.',
                  action: 'Direct SDR phone escalation with pre-filled appointment link.',
                },
                {
                  type: 'Booked No-Sale',
                  severity: 'High',
                  time: '24h post-call',
                  desc: 'Scheduled call completed with no recorded commercial outcome.',
                  action: 'Closer handoff task with contract closing incentive.',
                },
                {
                  type: 'Stale Lost Recovery',
                  severity: 'Medium',
                  time: '14d re-qualify',
                  desc: 'Previously disqualified or lost lead reaching re-engagement policy window.',
                  action: 'Autonomous nurture sequence to reactivate interest.',
                },
              ].map((leak, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4.5 space-y-1.5 transition hover:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{leak.type}</span>
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                        {leak.time}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        leak.severity === 'Critical'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : leak.severity === 'High'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}
                    >
                      {leak.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{leak.desc}</p>
                  <div className="text-[11px] font-medium text-indigo-300">
                    Engine Action: {leak.action}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive ROI Calculator */}
      <section id="calculator" className="border-t border-slate-800/80 bg-[#090d1a] py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <div className="text-xs font-bold uppercase tracking-widest text-emerald-400">Financial Impact</div>
            <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
              Pipeline Leakage & Recovery Calculator
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
              Estimate how much pipeline value is currently leaking and the expected recovered revenue.
            </p>
          </div>

          <div className="mt-12 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 md:p-10">
            <div className="grid gap-10 md:grid-cols-2">
              {/* Sliders */}
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">Monthly Inbound Leads</span>
                    <span className="text-indigo-400 font-bold">{monthlyLeads.toLocaleString()} leads</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={2000}
                    step={25}
                    value={monthlyLeads}
                    onChange={(e) => setMonthlyLeads(Number(e.target.value))}
                    className="mt-2 w-full accent-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">Average Deal Value (NGN)</span>
                    <span className="text-indigo-400 font-bold">₦{avgDealValue.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min={25000}
                    max={1000000}
                    step={25000}
                    value={avgDealValue}
                    onChange={(e) => setAvgDealValue(Number(e.target.value))}
                    className="mt-2 w-full accent-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">Estimated Funnel Dropoff / Leakage</span>
                    <span className="text-red-400 font-bold">{leakageRate}%</span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={65}
                    step={5}
                    value={leakageRate}
                    onChange={(e) => setLeakageRate(Number(e.target.value))}
                    className="mt-2 w-full accent-red-500"
                  />
                </div>

                <div className="rounded-2xl border border-slate-800 bg-[#070a13] p-4 text-xs text-slate-400">
                  Calculations use deterministic qualification thresholds (70 baseline) and standard SDR recovery conversion curves.
                </div>
              </div>

              {/* Output Card */}
              <div className="flex flex-col justify-between rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-slate-900/50 to-emerald-500/5 p-6">
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Projected Recovered Revenue</div>
                  <div className="mt-2 text-3xl font-black text-emerald-400 sm:text-4xl">
                    ₦{calculation.recoverableEstimate.toLocaleString()}
                    <span className="text-xs font-normal text-slate-400"> / month</span>
                  </div>

                  <div className="mt-6 space-y-3 border-t border-slate-800 pt-5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Total Pipeline Value:</span>
                      <span className="font-semibold text-slate-200">₦{calculation.totalPipelineValue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Pipeline Leaking at Risk:</span>
                      <span className="font-semibold text-rose-300">₦{calculation.revenueAtRisk.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Expected ROI:</span>
                      <span className="font-bold text-indigo-300">{calculation.estimatedRoi}x ROI</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onLaunchWorkspace('Overview')}
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                >
                  Launch Engine with These Metrics <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Production Architecture & Security */}
      <section id="architecture" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <div className="text-xs font-bold uppercase tracking-widest text-indigo-400">Enterprise Standards</div>
            <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
              Architected for Zero-Trust Multi-Tenancy
            </h2>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            <div className="card p-6 space-y-3">
              <div className="w-fit rounded-xl bg-indigo-500/10 p-3 text-indigo-400">
                <Database size={22} />
              </div>
              <h3 className="text-base font-bold text-white">PostgreSQL Row-Level Security</h3>
              <p className="text-xs leading-relaxed text-slate-400">
                Every query is locked to the tenant context with active PostgreSQL RLS policies. Tenant A can never inspect or alter Tenant B records.
              </p>
            </div>

            <div className="card p-6 space-y-3">
              <div className="w-fit rounded-xl bg-indigo-500/10 p-3 text-indigo-400">
                <Lock size={22} />
              </div>
              <h3 className="text-base font-bold text-white">Deterministic Idempotency</h3>
              <p className="text-xs leading-relaxed text-slate-400">
                Financial wins use deterministic idempotency keys (<code className="text-[11px] text-indigo-300">recovery:&#123;id&#125;:won</code>) ensuring retries never produce duplicate revenue.
              </p>
            </div>

            <div className="card p-6 space-y-3">
              <div className="w-fit rounded-xl bg-indigo-500/10 p-3 text-indigo-400">
                <Cpu size={22} />
              </div>
              <h3 className="text-base font-bold text-white">Session-Derived Authorization</h3>
              <p className="text-xs leading-relaxed text-slate-400">
                Least-privilege RBAC for Viewer, Agent, Manager, Admin, and Owner roles with session-derived identity verification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#050810] py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 font-bold text-xs text-white">
              Z
            </div>
            <div className="text-xs text-slate-400">
              © {new Date().getFullYear()} Zeerocodes Revenue Growth Engine. All rights reserved.
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
            <button onClick={() => onLaunchWorkspace('Overview')} className="hover:text-white transition">
              Overview
            </button>
            <button onClick={() => onLaunchWorkspace('Leads')} className="hover:text-white transition">
              Leads
            </button>
            <button onClick={() => onLaunchWorkspace('Lead Sources')} className="hover:text-white transition">
              Lead Sources
            </button>
            <button onClick={() => onLaunchWorkspace('SDR Queue')} className="hover:text-white transition">
              SDR Queue
            </button>
            <button onClick={() => onLaunchWorkspace('Revenue')} className="hover:text-white transition">
              Revenue
            </button>
            <button onClick={() => onLaunchWorkspace('Settings')} className="hover:text-white transition">
              Settings
            </button>
          </div>
        </div>
      </footer>

      {/* Revenue Leak Audit Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur-md overflow-y-auto">
          <div className="card my-8 max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6 sm:p-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Zeerocodes Diagnostic Request
                </div>
                <h3 className="mt-1 text-2xl font-bold text-white">
                  Request a Free Revenue Leak Audit
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  Our revenue operations engineers will analyze your conversion drop-offs, speed-to-lead SLAs, and pipeline leakage points to deliver a tailored recovery roadmap.
                </p>
              </div>
              <button
                aria-label="Close"
                onClick={() => {
                  setShowAuditModal(false);
                  setAuditSuccess(null);
                  setAuditError(null);
                }}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {auditSuccess ? (
              <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center space-y-3">
                <CheckCircle2 size={36} className="mx-auto text-emerald-400" />
                <h4 className="text-lg font-bold text-white">Diagnostic Request Received</h4>
                <p className="text-sm text-emerald-200">{auditSuccess}</p>
                <button
                  onClick={() => {
                    setShowAuditModal(false);
                    setAuditSuccess(null);
                  }}
                  className="mt-4 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={(e) => void handleAuditSubmit(e)} className="mt-6 space-y-4">
                {auditError && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
                    {auditError}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Full Name *
                    <input
                      name="name"
                      required
                      placeholder="e.g. Alex Rivera"
                      className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-300">
                    Company / Business Name *
                    <input
                      name="business"
                      required
                      placeholder="e.g. Apex Advisory Ltd"
                      className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Work Email *
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="alex@apexadvisory.com"
                      className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-300">
                    Phone / WhatsApp *
                    <input
                      name="phone"
                      required
                      placeholder="+234 800 000 0000"
                      className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Website (optional)
                    <input
                      name="website"
                      placeholder="https://apexadvisory.com"
                      className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-300">
                    Current CRM (optional)
                    <input
                      name="currentCrm"
                      placeholder="e.g. HubSpot, Zoho, Sheets"
                      className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Monthly Inbound Lead Volume *
                    <select
                      name="monthlyLeadVolume"
                      required
                      defaultValue="50–200 leads/mo"
                      className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="Under 50 leads/mo">Under 50 leads/mo</option>
                      <option value="50–200 leads/mo">50–200 leads/mo</option>
                      <option value="200–1,000 leads/mo">200–1,000 leads/mo</option>
                      <option value="1,000+ leads/mo">1,000+ leads/mo</option>
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-slate-300">
                    Average Deal Value (₦)
                    <input
                      name="averageDealValue"
                      type="number"
                      min="0"
                      placeholder="150000"
                      className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </label>
                </div>

                <label className="text-xs font-semibold text-slate-300 block">
                  Biggest Sales / Revenue Bottleneck *
                  <select
                    name="biggestSalesBottleneck"
                    required
                    defaultValue="Slow response to inbound inquiries"
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Slow response to inbound inquiries">Slow response time / SLA dropoffs</option>
                    <option value="Leads fall through cracks / unworked">Unworked leads / inconsistent follow-ups</option>
                    <option value="Unqualified bookings wasting closer time">Unqualified meetings wasting sales rep time</option>
                    <option value="Stalled deals with no follow-up triggers">Deals stalling in quote or proposal phase</option>
                    <option value="No attribution from marketing spend to cash">No visibility into which lead sources actually close</option>
                  </select>
                </label>

                <label className="text-xs font-semibold text-slate-300 block">
                  Where do you suspect leads are getting lost? (optional)
                  <textarea
                    name="whereLeadsAreLost"
                    rows={3}
                    placeholder="e.g. In WhatsApp chats when reps get overwhelmed, or after the first quote is sent."
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </label>

                <button
                  type="submit"
                  disabled={auditBusy}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition disabled:opacity-50"
                >
                  {auditBusy ? 'Submitting Diagnostic Request…' : 'Submit Free Revenue Audit Request'} <Send size={16} />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
