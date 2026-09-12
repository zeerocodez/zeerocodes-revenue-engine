import { qualifyLead } from '../domain/qualification';
import { createAuditEvent, type AuditEvent } from '../domain/audit';
import { decideLeadAction, type DecisionResult } from '../domain/decision-engine';
import { canTransition, transitionLead, type LeadState } from '../domain/lead-state';
import type { LeadIntakeInput, LeadRecord } from '../domain/lead';
import { scoreLead } from '../domain/scoring';
import type { ClientQualificationPolicy } from '../domain/client-policy';
import { evaluateClientPolicy } from '../domain/client-policy';
import type { LeadEvent, LeadEventStore } from '../domain/lead-events';

export interface LeadStore {
  get(id: string): Promise<LeadRecord | null>;
  save(lead: LeadRecord): Promise<void>;
  list(organizationId: string): Promise<LeadRecord[]>;
}

export interface LeadDecisionResponse {
  lead: LeadRecord;
  decision: DecisionResult;
  auditEvent: AuditEvent;
}

function id(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function toLeadEvent(
  lead: LeadRecord,
  type: LeadEvent['type'],
  reason: string,
  fromState?: LeadState,
  toState?: LeadState,
  metadata?: Record<string, unknown>,
): LeadEvent {
  return {
    id: id('evt'),
    leadId: lead.id,
    organizationId: lead.organizationId,
    type,
    actor: 'system',
    timestamp: new Date().toISOString(),
    fromState,
    toState,
    reason,
    metadata,
  };
}

export class RevenueEngineService {
  constructor(
    private readonly store: LeadStore,
    private readonly policy?: ClientQualificationPolicy,
    private readonly eventStore?: LeadEventStore,
  ) {}

  async intake(input: LeadIntakeInput): Promise<LeadDecisionResponse> {
    const now = new Date().toISOString();
    const profile = input.profile ?? {};
    const qualification = qualifyLead(profile);
    const score = scoreLead(profile);
    const policyResult = this.policy ? evaluateClientPolicy(profile, this.policy) : {
      ...qualification,
      qualified: qualification.qualified,
    };

    const decision = decideLeadAction({
      score: { ...score, qualified: policyResult.qualified, hardDisqualified: policyResult.hardDisqualified },
      consent: input.consent !== false,
      hardDisqualified: policyResult.hardDisqualified,
    });

    const nextState: LeadState = decision.action === 'reject'
      ? 'invalid'
      : decision.action === 'nurture'
        ? 'nurture'
        : decision.action === 'closer-handoff'
          ? 'booked'
          : 'contacting';

    const lead: LeadRecord = {
      id: id('lead'),
      organizationId: input.organizationId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      source: input.source,
      state: nextState,
      profile,
      consent: input.consent !== false,
      createdAt: now,
      updatedAt: now,
      score: score.score,
      qualification: { ...qualification, qualified: policyResult.qualified, hardDisqualified: policyResult.hardDisqualified },
      decision,
      metadata: input.metadata,
    };

    await this.store.save(lead);
    const auditEvent = createAuditEvent({
      organizationId: lead.organizationId,
      leadId: lead.id,
      actor: 'system',
      action: 'lead_intake_decision',
      fromState: 'new',
      toState: lead.state,
      reason: decision.reason,
      source: input.source,
      metadata: { score: score.score, qualified: policyResult.qualified, route: decision.route },
    });

    await this.eventStore?.append(toLeadEvent(lead, 'lead.created', 'lead captured', undefined, lead.state, { source: input.source }));
    await this.eventStore?.append(toLeadEvent(lead, 'lead.scored', decision.reason, lead.state, lead.state, { score: score.score, band: score.band, qualified: policyResult.qualified }));
    await this.eventStore?.append(toLeadEvent(lead, 'lead.routed', decision.reason, lead.state, lead.state, { route: decision.route, action: decision.action }));

    return { lead, decision, auditEvent };
  }

  async redecide(id: string): Promise<LeadDecisionResponse> {
    const lead = await this.store.get(id);
    if (!lead) throw new Error(`Lead not found: ${id}`);

    const previousState = lead.state;
    const score = scoreLead(lead.profile);
    const policyResult = this.policy ? evaluateClientPolicy(lead.profile, this.policy) : {
      score: score.score,
      qualified: score.qualified,
      reasons: score.reasons,
      hardDisqualified: score.hardDisqualified,
    };
    const decision = decideLeadAction({
      score: { ...score, qualified: policyResult.qualified, hardDisqualified: policyResult.hardDisqualified },
      consent: lead.consent,
      hardDisqualified: policyResult.hardDisqualified,
    });

    const desiredState: LeadState = decision.action === 'reject' ? 'invalid'
      : decision.action === 'nurture' ? 'nurture'
      : decision.action === 'closer-handoff' ? 'booked'
      : 'contacting';
    const nextState = canTransition(previousState, desiredState) ? transitionLead(previousState, desiredState) : previousState;

    lead.state = nextState;
    lead.score = score.score;
    lead.qualification = { ...lead.qualification, score: score.score, qualified: policyResult.qualified, reasons: policyResult.reasons, hardDisqualified: policyResult.hardDisqualified };
    lead.decision = decision;
    lead.updatedAt = new Date().toISOString();
    await this.store.save(lead);

    const auditEvent = createAuditEvent({
      organizationId: lead.organizationId,
      leadId: lead.id,
      actor: 'system',
      action: 'lead_redecision',
      fromState: previousState,
      toState: nextState,
      reason: decision.reason,
      source: lead.source,
      metadata: { score: score.score, qualified: policyResult.qualified, route: decision.route, statePreserved: nextState === previousState && desiredState !== previousState },
    });

    await this.eventStore?.append(toLeadEvent(lead, 'lead.scored', 'decision recalculated', previousState, nextState, { score: score.score, band: score.band, qualified: policyResult.qualified }));
    if (previousState !== nextState) {
      await this.eventStore?.append(toLeadEvent(lead, 'lead.state_changed', decision.reason, previousState, nextState, { route: decision.route, action: decision.action }));
    }
    await this.eventStore?.append(toLeadEvent(lead, decision.action === 'reject' ? 'lead.rejected' : 'lead.routed', decision.reason, nextState, nextState, { route: decision.route, action: decision.action, statePreserved: nextState === previousState && desiredState !== previousState }));

    return { lead, decision, auditEvent };
  }
}
