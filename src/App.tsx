import { useMemo, useState, type ReactNode } from 'react';
import { Activity, Bot, CheckCircle2, CircleDollarSign, GitBranch, Inbox, LayoutDashboard, Settings2, ShieldCheck, Users } from 'lucide-react';
import LeadWorkspace from './features/revenue-engine/LeadWorkspace';
import { calculatePricing } from './domain/pricing';

const nav = [
  ['Overview', LayoutDashboard], ['Leads', Inbox], ['Pipeline', GitBranch], ['Follow-up', Activity], ['Qualification', ShieldCheck], ['Revenue', CircleDollarSign], ['Clients', Users], ['Settings', Settings2],
] as const;

export default function App() {
  const [active, setActive] = useState('Overview');
  const pricing = useMemo(() => calculatePricing({ monthlyLeadVolume: 250, qualificationRate: 0.32, qualifiedLeadValue: 120000, responseSlaMinutes: 5, serviceTier: 'growth' }), []);

  return <div className="min-h-screen bg-[#080b14] text-slate-100">
    <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-800 bg-[#0b0f1a] p-5 lg:block">
      <div className="mb-8 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500 font-black">Z</div><div><div className="font-bold">Zeerocodes</div><div className="text-xs text-slate-500">Revenue Engine</div></div></div>
      <nav className="space-y-1">{nav.map(([label, Icon]) => <button key={label} onClick={() => setActive(label)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${active === label ? 'bg-indigo-500/15 text-indigo-300' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'}`}><Icon size={17}/>{label}</button>)}</nav>
      <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4"><div className="flex items-center gap-2 text-sm font-semibold text-emerald-300"><CheckCircle2 size={16}/> Engine healthy</div><div className="mt-1 text-xs text-slate-500">Deterministic rules online</div></div>
    </aside>

    <main className="lg:pl-64">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-[#080b14]/90 px-5 py-4 backdrop-blur md:px-8"><div><div className="text-xs uppercase tracking-[0.18em] text-indigo-300">Revenue operating system</div><h1 className="mt-1 text-xl font-bold">{active}</h1></div><div className="flex items-center gap-2 rounded-full border border-slate-800 px-3 py-1.5 text-xs text-slate-400"><span className="h-2 w-2 rounded-full bg-emerald-400"/> API connected</div></header>
      <section className="space-y-6 p-5 md:p-8">{active === 'Leads' ? <LeadWorkspace organizationId="default"/> : <Overview pricing={pricing} onOpenLeads={() => setActive('Leads')} active={active}/>}</section>
    </main>
  </div>;
}

function Overview({ pricing, onOpenLeads, active }: { pricing: ReturnType<typeof calculatePricing>; onOpenLeads: () => void; active: string }) {
  return <>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={<Inbox size={18}/>} label="Lead workspace" value="Ready"/><Metric icon={<Bot size={18}/>} label="Decision engine" value="Online"/><Metric icon={<CircleDollarSign size={18}/>} label="Illustrative value" value={`₦${pricing.estimatedMonthlyValue.toLocaleString()}`}/><Metric icon={<ShieldCheck size={18}/>} label="Policy layer" value="Active"/></div>
    <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
      <section className="card p-6"><div className="flex items-start justify-between gap-4"><div><div className="text-xs uppercase tracking-wider text-indigo-300">Next operating surface</div><h2 className="mt-2 text-2xl font-bold">Run the business from the Lead Workspace.</h2><p className="mt-2 max-w-2xl text-sm leading-6 muted">Inbox, conversation timeline, qualification signals, routing decision and re-decision are now connected to the same revenue-engine API.</p></div><div className="rounded-2xl bg-indigo-500/10 p-3 text-indigo-300"><GitBranch size={22}/></div></div><button onClick={onOpenLeads} className="mt-6 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold hover:bg-indigo-400">Open Lead Workspace</button></section>
      <section className="card p-6"><h2 className="font-semibold">Operating controls</h2><div className="mt-4 space-y-2">{['Consent and client policy','Deterministic qualification','Score and reason codes','AI / human routing boundary','Audit-ready lead decisions'].map((item) => <div key={item} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-sm"><CheckCircle2 size={15} className="text-emerald-400"/>{item}</div>)}</div></section>
    </div>
    <section className="card p-6"><h2 className="font-semibold">Build status</h2><div className="mt-4 grid gap-3 md:grid-cols-4">{[['Domain','Complete'],['API intake','Complete'],['Lead workspace','Complete'],['Firebase persistence','Next']].map(([a,b]) => <div key={a} className="rounded-xl bg-slate-900/60 p-4"><div className="text-xs muted">{a}</div><div className="mt-1 text-sm font-semibold">{b}</div></div>)}</div><div className="mt-4 text-xs muted">Current view: {active}. The memory adapter is intentionally temporary; production persistence comes after the workflow is validated.</div></section>
  </>;
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) { return <div className="card p-5"><div className="mb-4 rounded-xl bg-indigo-500/10 p-2 text-indigo-300 w-fit">{icon}</div><div className="text-xs muted">{label}</div><div className="mt-1 text-xl font-bold metric-value">{value}</div></div> }
