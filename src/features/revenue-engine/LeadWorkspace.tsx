import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowRight, Bot, Check, Clock3, MessageSquare, Phone, Send, UserRound } from 'lucide-react';
import type { LeadRecord } from '../../domain/lead';
import type { LeadEvent } from '../../domain/lead-events';
import type { LeadState } from '../../domain/lead-state';
import { scoreLead } from '../../domain/scoring';
import { routeLead } from '../../domain/routing';

type Props = { organizationId?: string };

export default function LeadWorkspace({ organizationId = 'default' }: Props) {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [events, setEvents] = useState<LeadEvent[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadLeads() {
    setLoading(true);
    const response = await fetch(`/api/leads?organizationId=${encodeURIComponent(organizationId)}`);
    const data = await response.json();
    setLeads(data.leads ?? []);
    setSelectedId((current) => current ?? data.leads?.[0]?.id);
    setLoading(false);
  }

  async function loadEvents(leadId?: string) {
    if (!leadId) {
      setEvents([]);
      return;
    }
    const response = await fetch(`/api/leads/${encodeURIComponent(leadId)}/events`);
    if (!response.ok) {
      setEvents([]);
      return;
    }
    const data = await response.json();
    setEvents(data.events ?? []);
  }

  useEffect(() => { void loadLeads(); }, [organizationId]);
  useEffect(() => { void loadEvents(selectedId); }, [selectedId]);

  const selected = useMemo(() => leads.find((lead) => lead.id === selectedId), [leads, selectedId]);
  const score = selected ? scoreLead(selected.profile) : null;
  const route = score && selected ? routeLead({ score, appointmentBooked: selected.state === 'booked' }) : null;

  async function redecide() {
    if (!selected) return;
    await fetch(`/api/leads/${selected.id}/redecide`, { method: 'POST' });
    await loadLeads();
    await loadEvents(selected.id);
  }

  if (loading) return <div className="card p-8 text-sm muted">Loading lead workspace…</div>;

  return (
    <div className="grid min-h-[650px] gap-4 xl:grid-cols-[300px_1fr_330px]">
      <LeadList leads={leads} selectedId={selectedId} onSelect={setSelectedId} />
      {selected ? <ConversationPane lead={selected} route={route ?? 'nurture'} events={events} onRefresh={async () => { await loadLeads(); await loadEvents(selected.id); }} /> : <EmptyWorkspace />}
      {selected && score ? <DecisionPanel lead={selected} score={score} route={route ?? 'nurture'} onRedecide={redecide} /> : null}
    </div>
  );
}

function LeadList({ leads, selectedId, onSelect }: { leads: LeadRecord[]; selectedId?: string; onSelect: (id: string) => void }) {
  return <section className="card overflow-hidden">
    <div className="border-b border-slate-800 p-4"><div className="font-semibold">Inbox</div><div className="mt-1 text-xs muted">{leads.length} leads in engine</div></div>
    <div className="divide-y divide-slate-800/70">
      {leads.map((lead) => <button key={lead.id} onClick={() => onSelect(lead.id)} className={`w-full p-4 text-left transition ${selectedId === lead.id ? 'bg-indigo-500/10' : 'hover:bg-slate-900/60'}`}>
        <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-800 text-xs font-semibold">{lead.name.slice(0, 1)}</span><div className="min-w-0"><div className="truncate text-sm font-medium">{lead.name}</div><div className="truncate text-xs muted">{lead.source ?? 'Direct'}</div></div></div><StateBadge state={lead.state}/></div>
      </button>)}
      {!leads.length && <div className="p-6 text-center text-sm muted">No leads yet. Use the intake API to create the first lead.</div>}
    </div>
  </section>;
}

function ConversationPane({ lead, route, events }: { lead: LeadRecord; route: string; events: LeadEvent[]; onRefresh: () => Promise<void> }) {
  return <section className="card flex min-h-[650px] flex-col overflow-hidden">
    <div className="flex items-center justify-between border-b border-slate-800 p-4"><div><div className="font-semibold">{lead.name}</div><div className="mt-1 text-xs muted">{lead.phone ?? lead.email ?? 'No contact channel'} · {lead.source ?? 'Direct'}</div></div><div className="flex gap-2"><button className="rounded-lg border border-slate-700 p-2 text-slate-400" title="Call"><Phone size={16}/></button><button className="rounded-lg border border-slate-700 p-2 text-slate-400" title="Message"><MessageSquare size={16}/></button></div></div>
    <div className="flex-1 space-y-4 overflow-y-auto bg-[#0a0f1b] p-5">
      {events.length ? events.map((event) => <TimelineItem key={event.id} icon={eventIcon(event.type)} title={eventTitle(event.type)} text={event.reason ?? event.type} time={event.timestamp}/>) : <>
        <TimelineItem icon={<Bot size={14}/>} title="Revenue Engine" text={`Lead routed to ${route}. Decision: ${lead.decision?.reason ?? 'awaiting decision'}.`} time={lead.updatedAt}/>
        <TimelineItem icon={<UserRound size={14}/>} title="Lead captured" text={`${lead.name} entered from ${lead.source ?? 'direct'}.`} time={lead.createdAt}/>
      </>}
    </div>
    <div className="border-t border-slate-800 p-4"><div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 p-2"><input className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none" placeholder="Reply or add an internal note…"/><button className="rounded-lg bg-indigo-500 p-2 text-white"><Send size={15}/></button></div><div className="mt-2 flex items-center gap-2 text-[11px] muted"><Clock3 size={12}/> Next automated action follows the current decision policy.</div></div>
  </section>;
}

function eventIcon(type: LeadEvent['type']) {
  if (type === 'lead.created') return <UserRound size={14}/>;
  if (type === 'lead.scored') return <Check size={14}/>;
  if (type === 'lead.routed') return <ArrowRight size={14}/>;
  if (type === 'lead.rejected') return <Bot size={14}/>;
  return <Clock3 size={14}/>;
}

function eventTitle(type: LeadEvent['type']) {
  return type.replace('lead.', '').replaceAll('_', ' ');
}

function DecisionPanel({ lead, score, route, onRedecide }: { lead: LeadRecord; score: ReturnType<typeof scoreLead>; route: string; onRedecide: () => Promise<void> }) {
  return <section className="card p-5">
    <div className="flex items-center gap-3"><div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-300"><Bot size={18}/></div><div><div className="font-semibold">Decision</div><div className="text-xs muted">Rules first, AI assists.</div></div></div>
    <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-4"><div className="text-xs muted">Lead score</div><div className="mt-1 text-3xl font-bold">{score.score}<span className="ml-2 text-sm font-medium text-slate-500">{score.band}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(100, score.score)}%` }}/></div></div>
    <div className="mt-4 space-y-2">{[
      ['Consent', lead.consent ? 'passed' : 'failed'],
      ['Qualification', score.qualified ? 'qualified' : 'not qualified'],
      ['Route', route],
      ['State', lead.state],
    ].map(([label, value]) => <div key={label} className="flex items-center justify-between border-b border-slate-800 py-2 text-sm"><span className="muted">{label}</span><span className="font-medium">{value}</span></div>)}</div>
    <div className="mt-5"><div className="mb-2 text-xs uppercase tracking-wider text-slate-500">Reason codes</div><div className="flex flex-wrap gap-2">{score.reasons.length ? score.reasons.map((reason) => <span key={reason} className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] text-slate-300">{reason}</span>) : <span className="text-xs muted">No positive signals yet.</span>}</div></div>
    <button onClick={() => void onRedecide()} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-sm font-semibold text-indigo-300 hover:bg-indigo-500/20">Re-run decision <ArrowRight size={15}/></button>
  </section>;
}

function TimelineItem({ icon, title, text, time }: { icon: ReactNode; title: string; text: string; time: string }) { return <div className="flex gap-3"><div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-800 text-indigo-300">{icon}</div><div><div className="text-sm font-medium capitalize">{title}</div><div className="mt-1 text-sm text-slate-400">{text}</div><div className="mt-1 text-[10px] text-slate-600">{new Date(time).toLocaleString()}</div></div></div> }
function StateBadge({ state }: { state: LeadState }) { const tone = state === 'qualified' || state === 'won' ? 'text-emerald-300 bg-emerald-500/10' : state === 'booked' ? 'text-indigo-300 bg-indigo-500/10' : state === 'lost' || state === 'invalid' ? 'text-rose-300 bg-rose-500/10' : 'text-amber-300 bg-amber-500/10'; return <span className={`rounded-full px-2 py-1 text-[10px] ${tone}`}>{state}</span> }
function EmptyWorkspace() { return <section className="card grid place-items-center xl:col-span-2"><div className="text-center"><div className="text-lg font-semibold">Select a lead</div><div className="mt-1 text-sm muted">The conversation and decision workspace will appear here.</div></div></section> }
