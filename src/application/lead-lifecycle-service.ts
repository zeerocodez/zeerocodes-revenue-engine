import type { LeadRecord } from '../domain/lead';
import type { LeadEvent, LeadEventStore } from '../domain/lead-events';
import type { LeadState } from '../domain/lead-state';
import {
  evaluateLeadStateSla,
  evaluateLeadTransition,
  stateHistoryMetadata,
  transitionLeadWithPolicy,
  type LeadSlaDecision,
  type LeadTransitionContext,
  type LeadTransitionDecision,
} from '../domain/lead-state-machine';

export interface LeadLifecycleStore {
  get(id: string): Promise<LeadRecord | null>;
  save(lead: LeadRecord): Promise<void>;
}

export interface LeadLifecycleTransitionInput extends Omit<LeadTransitionContext, 'to'> {
  leadId: string;
  organizationId: string;
  to: LeadState;
}

function eventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function transitionEvent(lead: LeadRecord, decision: LeadTransitionDecision, context: LeadTransitionContext): LeadEvent {
  return {
    id: eventId(),
    leadId: lead.id,
    organizationId: lead.organizationId,
    type: 'lead.state_changed',
    actor: context.requestedHuman ? 'sdr' : 'system',
    timestamp: context.now ?? new Date().toISOString(),
    fromState: context.from,
    toState: context.to,
    reason: decision.reason,
    metadata: stateHistoryMetadata(context, decision),
  };
}

/** Application boundary for all guarded lead lifecycle transitions. */
export class LeadLifecycleService {
  constructor(
    private readonly store: LeadLifecycleStore,
    private readonly eventStore?: LeadEventStore,
  ) {}

  async transition(input: LeadLifecycleTransitionInput): Promise<{ lead: LeadRecord; decision: LeadTransitionDecision }> {
    const lead = await this.store.get(input.leadId);
    if (!lead) throw new Error(`Lead not found: ${input.leadId}`);
    if (lead.organizationId !== input.organizationId) throw new Error('Tenant access denied');
    if (lead.state !== input.from) throw new Error(`Lead state conflict: expected ${input.from}, found ${lead.state}`);

    const context: LeadTransitionContext = {
      ...input,
      from: lead.state,
      to: input.to,
    };
    const decision = evaluateLeadTransition(context);
    if (!decision.allowed) throw new Error(decision.reason);

    transitionLeadWithPolicy(context);
    const now = input.now ?? new Date().toISOString();
    lead.previousState = lead.state;
    lead.state = input.to;
    lead.updatedAt = now;
    lead.metadata = {
      ...lead.metadata,
      lastStateTransition: stateHistoryMetadata(context, decision),
    };

    if (input.outcome === 'won') lead.outcome = { ...lead.outcome, wonAt: now };
    if (input.outcome === 'lost' || input.outcome === 'no_sale' || input.outcome === 'unqualified') {
      lead.outcome = { ...lead.outcome, lostAt: now, lostReason: input.outcome };
    }

    await this.store.save(lead);
    await this.eventStore?.append(transitionEvent(lead, decision, context));

    if (input.to === 'won') {
      await this.eventStore?.append({
        id: eventId(), leadId: lead.id, organizationId: lead.organizationId, type: 'lead.won',
        actor: context.requestedHuman ? 'closer' : 'system', timestamp: now,
        fromState: input.from, toState: input.to, reason: 'lead won', metadata: { outcome: input.outcome },
      });
    }
    if (input.to === 'lost') {
      await this.eventStore?.append({
        id: eventId(), leadId: lead.id, organizationId: lead.organizationId, type: 'lead.lost',
        actor: context.requestedHuman ? 'sdr' : 'system', timestamp: now,
        fromState: input.from, toState: input.to, reason: input.outcome ?? 'lead lost', metadata: { outcome: input.outcome },
      });
    }

    return { lead, decision };
  }

  async evaluateSla(leadId: string, organizationId: string, now = new Date().toISOString()): Promise<LeadSlaDecision> {
    const lead = await this.store.get(leadId);
    if (!lead) throw new Error(`Lead not found: ${leadId}`);
    if (lead.organizationId !== organizationId) throw new Error('Tenant access denied');
    const lastActivityAt = lead.engagement?.lastInboundAt ?? lead.updatedAt ?? lead.createdAt;
    return evaluateLeadStateSla(lead.state, lastActivityAt, now);
  }
}
