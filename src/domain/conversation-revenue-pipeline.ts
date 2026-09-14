import { decideConversation, type ConversationDecision, type ConversationDecisionContext } from './conversation-decision-engine';
import { decideLeadAction, type DecisionResult } from './decision-engine';
import { buildRevenueActionPlan, type RevenueActionPlan } from './revenue-action-plan';
import type { LeadScore } from './scoring';

export interface ConversationRevenuePipelineContext extends ConversationDecisionContext {
  state: Parameters<typeof buildRevenueActionPlan>[0]['state'];
  urgencyDays?: number;
  estimatedDealValue?: number;
  hasInboundMessage: boolean;
  lastOutboundAt?: string;
  now?: string;
  responseSlaMinutes?: number;
}

export interface ConversationRevenuePipelineResult {
  conversation: ConversationDecision;
  decision: DecisionResult;
  plan: RevenueActionPlan;
}

function mapIntent(intent: ConversationDecision['intent']): NonNullable<Parameters<typeof decideLeadAction>[0]['intent']> {
  switch (intent) {
    case 'booking_intent': return 'booking';
    case 'human_request': return 'human_request';
    case 'pricing': return 'pricing';
    case 'objection': return 'objection';
    case 'complaint': return 'complaint';
    case 'stop': return 'stop';
    case 'qualification_answer': return 'qualification';
    case 'information_request': return 'information';
    default: return 'unknown';
  }
}

/**
 * Converts one inbound conversation into the single revenue decision artifact
 * consumed by downstream channels. No channel-specific behavior lives here.
 */
export function evaluateConversationRevenuePipeline(context: ConversationRevenuePipelineContext): ConversationRevenuePipelineResult {
  const conversation = decideConversation(context);
  const intent = mapIntent(conversation.intent);
  const decision = decideLeadAction({
    score: context.leadScore,
    consent: context.consent,
    hardDisqualified: context.leadScore.hardDisqualified,
    requestedHuman: context.requestedHuman || conversation.intent === 'human_request',
    appointmentBooked: context.appointmentBooked,
    intent,
    urgencyDays: context.urgencyDays,
    estimatedDealValue: context.estimatedDealValue,
  });

  const plan = buildRevenueActionPlan({
    state: context.state,
    decision,
    score: context.leadScore.score,
    intent,
    urgencyDays: context.urgencyDays,
    estimatedDealValue: context.estimatedDealValue,
    temperature: context.leadScore.band,
    hasInboundMessage: context.hasInboundMessage,
    lastOutboundAt: context.lastOutboundAt,
    now: context.now,
    responseSlaMinutes: context.responseSlaMinutes,
  });

  return { conversation, decision, plan };
}

export function leadScoreFromPipelineContext(context: ConversationRevenuePipelineContext): LeadScore {
  return context.leadScore;
}
