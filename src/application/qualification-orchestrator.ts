import type { LeadRecord } from '../domain/lead';
import { evaluateClientPolicy, DEFAULT_CLIENT_POLICY, type ClientQualificationPolicy } from '../domain/client-policy';
import { decideConversation, type ConversationDecision } from '../domain/conversation-decision-engine';
import { canTransition, transitionLead, type LeadState } from '../domain/lead-state';
import { scoreLead } from '../domain/scoring';
import { getNextQualificationQuestion, type QualificationField, type QualificationProgress, getQualificationProgress } from '../domain/qualification-question-engine';
import type { LeadStore } from './revenue-engine-service';
import type { LeadEventStore } from '../domain/lead-events';

export interface QualificationOrchestratorInput {
  leadId: string;
  organizationId: string;
  text: string;
  policy?: ClientQualificationPolicy;
}

export interface QualificationOrchestratorResult {
  lead: LeadRecord;
  conversationDecision: ConversationDecision;
  progress: QualificationProgress;
  nextQuestion?: string;
  extractedFields: Partial<Record<QualificationField, string | number | boolean>>;
  stateChanged: boolean;
}

function extractAnswers(text: string): Partial<Record<QualificationField, string | number | boolean>> {
  const value = text.trim();
  const lower = value.toLowerCase();
  const result: Partial<Record<QualificationField, string | number | boolean>> = {};

  if (/\b(yes|yeah|yep|correct|exactly|that'?s right)\b/i.test(value)) {
    result.serviceFit = true;
    result.needConfirmed = true;
  }
  if (/\b(no|nope|not really|not interested)\b/i.test(value)) result.serviceFit = false;
  if (/\b(i am|i'm|im|yes,? i)\b.*\b(decision maker|owner|boss|director|manager)\b/i.test(value) || /\b(i|we) (own|run) the business\b/i.test(value)) {
    result.decisionMaker = true;
  }
  if (/\b(not me|someone else|my boss|my partner|my manager)\b/i.test(value)) result.decisionMaker = false;

  const budget = value.match(/(?:₦|ngn|n)\s*([\d,]+(?:\.\d+)?)\s*(k|m|million|thousand)?\b/i) || value.match(/\b([\d,]+(?:\.\d+)?)\s*(k|m|million|thousand)\b/i);
  if (budget) {
    let amount = Number(budget[1].replace(/,/g, ''));
    const unit = (budget[2] || '').toLowerCase();
    if (unit === 'k' || unit === 'thousand') amount *= 1_000;
    if (unit === 'm' || unit === 'million') amount *= 1_000_000;
    if (Number.isFinite(amount)) result.budget = amount;
  }

  if (/\b(today|now|immediately|asap)\b/i.test(value)) result.urgencyDays = 0;
  else if (/\btomorrow\b/i.test(value)) result.urgencyDays = 1;
  else {
    const days = lower.match(/\b(?:in|within)\s+(\d+)\s+days?\b/);
    if (days) result.urgencyDays = Number(days[1]);
  }

  if (/\b(lagos|abuja|port harcourt|ibadan|calabar|enugu|benin|online|remote|nationwide)\b/i.test(value)) result.locationFit = true;

  if (value.length > 20 && !result.needConfirmed) result.needConfirmed = true;
  return result;
}

function desiredState(lead: LeadRecord, decision: ConversationDecision): LeadState {
  if (decision.action === 'opt-out') return 'lost';
  if (decision.action === 'escalate-complaint' || decision.action === 'escalate-sdr') return 'engaged';
  if (decision.action === 'handoff-closer') return 'booked';
  if (lead.qualification?.qualified) return 'qualified';
  return 'qualifying';
}

export class QualificationOrchestrator {
  constructor(
    private readonly leads: LeadStore,
    private readonly events?: LeadEventStore,
  ) {}

  async process(input: QualificationOrchestratorInput): Promise<QualificationOrchestratorResult> {
    if (!input.text.trim()) throw new Error('Conversation text is required');
    const lead = await this.leads.get(input.leadId);
    if (!lead) throw new Error(`Lead not found: ${input.leadId}`);
    if (lead.organizationId !== input.organizationId) throw new Error('Tenant access denied');

    const policy = input.policy ?? DEFAULT_CLIENT_POLICY;
    const extractedFields = extractAnswers(input.text);
    lead.profile = { ...lead.profile, ...extractedFields };

    const policyResult = evaluateClientPolicy(lead.profile, policy);
    const score = scoreLead(lead.profile);
    lead.score = score.score;
    lead.qualification = {
      score: score.score,
      qualified: policyResult.qualified,
      reasons: policyResult.reasons,
      hardDisqualified: policyResult.hardDisqualified,
    };

    const asked = Array.isArray(lead.metadata?.qualificationAsked)
      ? lead.metadata.qualificationAsked.filter((field): field is QualificationField => typeof field === 'string')
      : [];
    const progress = getQualificationProgress(lead.profile, policy, asked);
    const conversationDecision = decideConversation({
      text: input.text,
      leadScore: { ...score, qualified: policyResult.qualified, hardDisqualified: policyResult.hardDisqualified },
      consent: lead.consent,
      appointmentBooked: lead.state === 'booked',
      qualificationComplete: progress.complete,
    });

    const nextQuestion = getNextQualificationQuestion(lead.profile, policy, asked);
    if (nextQuestion && !asked.includes(nextQuestion.field)) asked.push(nextQuestion.field);

    const previousState = lead.state;
    const targetState = desiredState(lead, conversationDecision);
    const stateChanged = canTransition(previousState, targetState) && previousState !== targetState;
    if (stateChanged) lead.state = transitionLead(previousState, targetState);
    lead.decision = {
      action: conversationDecision.action === 'handoff-closer' ? 'closer-handoff'
        : conversationDecision.action === 'escalate-sdr' || conversationDecision.action === 'escalate-complaint' ? 'sdr-follow-up'
        : conversationDecision.action === 'opt-out' ? 'reject'
        : conversationDecision.action === 'ask-qualification' ? 'ai-follow-up'
        : 'ai-follow-up',
      route: conversationDecision.owner === 'closer' ? 'closer' : conversationDecision.owner === 'sdr' ? 'sdr' : 'ai-follow-up',
      reason: conversationDecision.reason,
    };
    lead.metadata = { ...lead.metadata, qualificationAsked: asked, lastConversationDecision: conversationDecision };
    lead.updatedAt = new Date().toISOString();
    await this.leads.save(lead);

    await this.events?.append({
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      leadId: lead.id,
      organizationId: lead.organizationId,
      type: 'lead.scored',
      actor: 'system',
      timestamp: new Date().toISOString(),
      fromState: previousState,
      toState: lead.state,
      reason: conversationDecision.reason,
      metadata: { extractedFields, score: score.score, qualified: policyResult.qualified, nextQuestion: nextQuestion?.id },
    });

    if (stateChanged) {
      await this.events?.append({
        id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        leadId: lead.id,
        organizationId: lead.organizationId,
        type: 'lead.state_changed',
        actor: 'system',
        timestamp: new Date().toISOString(),
        fromState: previousState,
        toState: lead.state,
        reason: conversationDecision.reason,
      });
    }

    return { lead, conversationDecision, progress, nextQuestion: nextQuestion?.prompt, extractedFields, stateChanged };
  }
}
