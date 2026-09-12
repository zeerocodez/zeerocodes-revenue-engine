import { useMemo, useState, type ReactNode } from 'react';
import { Activity, ArrowRight, Bot, CheckCircle2, CircleDollarSign, Clock3, Gauge, GitBranch, Inbox, LayoutDashboard, Settings2, ShieldCheck, Users } from 'lucide-react';
import { scoreLead } from './domain/scoring';
import { routeLead } from './domain/routing';
import { calculatePricing } from './domain/pricing';
import { LEAD_STATES, type LeadState } from './domain/lead-state';
import type { QualificationProfile } from './domain/qualification';

type DemoLead = QualificationProfile & { id: string; name: string; company: string; state: LeadState; source: string };

const demoLeads: DemoLead[] = [
  { id: 'L-1042', name: 'Ada Okon', company: 'Northstar Clinics', state: 'qualified', source: 'Meta Ads', serviceFit: true, needConfirmed: true, decisionMaker: true, locationFit: true, urgencyDays: 7, budget: 350000 },
  { id: 'L-1041', name: 'David Mensah', company: 'PrimeBuild', state: 'qualifying', source: 'Website', serviceFit: true, needConfirmed: true, decisionMaker: false, locationFit: true, urgencyDays: 21, budget: 180000 },
  { id: 'L-1040', name: 'Chioma Eze', company: 'Eze Legal', state: 'booked', source: 'Referral', serviceFit: true, needConfirmed: true, decisionMaker: true, locationFit: true, urgencyDays: 3, budget: 500000 },
  { id: 'L-1039', name: 'Michael Cole', company: 'Cole Estates', state: 'nurture', source: 'Google', serviceFit: true, needConfirmed: false, decisionMaker: false, locationFit: true, urgencyDays: 45, budget: null },
];

const nav = [
  ['Overview', LayoutDashboard], ['Leads', Inbox], ['Pipeline', GitBranch], ['Follow-up', Activity], ['Qualification', ShieldCheck], ['Revenue', CircleDollarSign], ['Clients', Users], ['Settings', Settings2],
] as const;

export default function App() {
  const [active, setActive] = useState('Overview');
  const [leads, setLeads] = useState(demoLeads);

  const metrics = useMemo(() => {
    const scored = leads.map((lead) => scoreLead(lead));
    const qualified = scored.filter((x) => x.qualified).length;
    return { total: leads.length, qualified, response: 3.4, booked: leads.filter((x) => x.state === 'booked').length };
  }, [leads]);

  const pricing = calculatePricing({ monthlyLeadVolume: 250, qualificationRate: 0.32, qualifiedLeadValue: 120000, responseSlaMinutes: 5, serviceTier: 'growth' });
  const runDemo = () => setLeads((current) => current.map((lead) => lead.state === 'qualifying' ? { ...lead, state: 'qualified' } : lead));

  return (
    <div className="min-h-screen bg-[#080b14] text-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-800 bg-[#0b0f1a] p-5 lg:block">
        <div className="mb-8 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500 font-black">Z</div><div><div className="font-bold">Zeerocodes</div><div className="text-xs text-slate-500">Revenue Engine</div></div></div>
        <nav className="space-y-1">{nav.map(([label, Icon]) => <button key={label} onClick={() => setActive(label)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${active === label ? 'bg-indigo-500/15 text-indigo-300' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'}`}><Icon size={17}/>{label}</button>)}</nav>
        <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4"><div className="flex items-center gap-2 text-sm font-semibold text-emerald-300"><Gauge size={16}/> Engine healthy</div><div className="mt-1 text-xs text-slate-500">Deterministic rules online</div></div>
      </aside>

      <main className="lg:pl-64">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-[#080b14]/90 px-5 py-4 backdrop-blur md:px-8"><div><div className="text-xs uppercase tracking-[0.18em] text-indigo-300">Revenue operating system</div><h1 className="mt-1 text-xl font-bold">{active}</h1></div><button onClick={runDemo} className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold hover:bg-indigo-400">Run qualification pass <ArrowRight size={16}/></button></header>
        <section className="space-y-6 p-5 md:p-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={<Inbox size={18}/>} label="Leads in engine" value={metrics.total}/><Metric icon={<CheckCircle2 size={18}/>} label="Qualified" value={metrics.qualified}/><Metric icon={<Clock3 size={18}/>} label="Avg first response" value={`${metrics.response}m`}/><Metric icon={<CalendarIcon/>} label="Booked" value={metrics.booked}/></div>
          <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <section className="card overflow-hidden"><div className="flex items-center justify-between border-b border-slate-800 p-5"><div><h2 className="font-semibold">Live lead pipeline</h2><p className="mt-1 text-xs muted">Every lead is scored before human routing.</p></div><span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">{leads.length} active</span></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-slate-500"><tr><th className="px-5 py-3">Lead</th><th>Source</th><th>Score</th><th>State</th><th>Route</th></tr></thead><tbody>{leads.map((lead) => { const score = scoreLead(lead); const route = routeLead({ score, appointmentBooked: lead.state === 'booked' }); return <tr key={lead.id} className="border-t border-slate-800/80"><td className="px-5 py-4"><div className="font-medium">{lead.name}</div><div className="text-xs muted">{lead.company}</div></td><td className="text-slate-400">{lead.source}</td><td><span className={`font-semibold ${score.band === 'hot' ? 'text-rose-300' : score.band === 'warm' ? 'text-amber-300' : 'text-slate-400'}`}>{score.score}</span></td><td><StateBadge state={lead.state}/></td><td className="text-xs text-indigo-300">{route}</td></tr>})}</tbody></table></div></section>
            <section className="card p-5"><div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-300"><Bot size={19}/></div><div><h2 className="font-semibold">Decision engine</h2><p className="text-xs muted">AI assists; rules control.</p></div></div><div className="space-y-3">{['Consent & policy checks','Deterministic qualification','Score + reason codes','Human/high-intent escalation','Audit every state change'].map((item, i) => <div key={item} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/30 p-3 text-sm"><span className="grid h-6 w-6 place-items-center rounded-full bg-slate-800 text-xs text-slate-400">{i + 1}</span>{item}<CheckCircle2 className="ml-auto text-emerald-400" size={15}/></div>)}</div></section>
          </div>
          <section className="grid gap-6 lg:grid-cols-3"><div className="card p-5 lg:col-span-2"><h2 className="font-semibold">Lead-state machine</h2><p className="mt-1 text-xs muted">Controlled transitions prevent pipeline corruption.</p><div className="mt-5 flex flex-wrap gap-2">{LEAD_STATES.map((state, i) => <div key={state} className="flex items-center gap-2"><StateBadge state={state}/>{i < LEAD_STATES.length - 1 && <span className="text-slate-700">→</span>}</div>)}</div></div><div className="card p-5"><h2 className="font-semibold">Pricing model</h2><div className="mt-4 text-2xl font-bold metric-value">₦{pricing.recommendedMonthlyFee.toLocaleString()}</div><div className="mt-1 text-xs muted">illustrative monthly recommendation</div><div className="mt-4 grid grid-cols-2 gap-3 text-xs"><div className="rounded-xl bg-slate-900 p-3"><div className="muted">Qualified</div><b>{pricing.estimatedQualifiedLeads}</b></div><div className="rounded-xl bg-slate-900 p-3"><div className="muted">Value created</div><b>₦{pricing.estimatedMonthlyValue.toLocaleString()}</b></div></div></div></section>
        </section>
      </main>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) { return <div className="card p-5"><div className="mb-4 flex items-center justify-between"><span className="rounded-xl bg-indigo-500/10 p-2 text-indigo-300">{icon}</span><span className="text-[10px] uppercase tracking-widest text-slate-600">30d</span></div><div className="text-xs muted">{label}</div><div className="mt-1 text-2xl font-bold metric-value">{value}</div></div> }
function StateBadge({ state }: { state: LeadState }) { const tone = state === 'qualified' || state === 'won' ? 'text-emerald-300 bg-emerald-500/10' : state === 'booked' ? 'text-indigo-300 bg-indigo-500/10' : state === 'lost' || state === 'invalid' ? 'text-rose-300 bg-rose-500/10' : 'text-amber-300 bg-amber-500/10'; return <span className={`rounded-full px-2.5 py-1 text-[11px] ${tone}`}>{state}</span> }
function CalendarIcon() { return <span className="text-sm">◷</span> }
