import { decideConversation, renderSafeConversationReply, type ConversationDecision } from '../domain/conversation-decision-engine';
import { getNextQualificationQuestion, getQualificationProgress } from '../domain/qualification-question-engine';
import type { ClientConfiguration } from '../domain/client-configuration';
import type { LeadRecord } from '../domain/lead';
import type { MessageChannel } from '../domain/message';
import { QualificationOrchestrator, type QualificationOrchestratorResult } from './qualification-orchestrator';
import { ConversationService } from './conversation-service';
import type { LeadStore } from './revenue-engine-service';

export interface LeadAgentResult {
  lead: LeadRecord;
  response?: string;
  responseSent: boolean;
  qualification?: QualificationOrchestratorResult;
  decision?: ConversationDecision;
}

/**
 * Deterministic first-response agent. It never invents pricing, promises outcomes,
 * or bypasses the qualification policy. A model provider can replace the copy
 * layer later without changing the qualification/routing contract.
 */
export class LeadResponseAgent {
  constructor(private readonly conversations: ConversationService) {}

  async sendInitialResponse(lead: LeadRecord, configuration: ClientConfiguration, channel: MessageChannel = 'web'): Promise<string> {
    const asked = Array.isArray(lead.metadata?.qualificationAsked)
      ? lead.metadata.qualificationAsked.filter((value): value is string => typeof value === 'string')
      : [];
    const progress = getQualificationProgress(lead.profile, configuration.qualification, asked);
    const next = getNextQualificationQuestion(lead.profile, configuration.qualification, asked);
    const text = progress.complete
      ? 'Thanks for reaching out. We have the details we need and a team member can take the next step with you.'
      : (next?.prompt ?? 'Thanks for reaching out. Tell me what you need help with, and I’ll guide you from there.');

    await this.conversations.sendMessage({ leadId: lead.id, organizationId: lead.organizationId, body: text, channel, actor: 'ai' });
    return text;
  }

  async respondToDecision(lead: LeadRecord, decision: ConversationDecision, nextQuestion?: string, channel: MessageChannel = 'web'): Promise<string | undefined> {
    const text = renderSafeConversationReply(decision, nextQuestion);
    if (!text) return undefined;
    await this.conversations.sendMessage({ leadId: lead.id, organizationId: lead.organizationId, body: text, channel, actor: 'ai' });
    return text;
  }
}

/** Runs qualification immediately on every inbound lead message. */
export class LeadQualificationAgent {
  constructor(private readonly orchestrator: QualificationOrchestrator) {}

  async qualify(leadId: string, organizationId: string, text: string, configuration: ClientConfiguration): Promise<QualificationOrchestratorResult> {
    return this.orchestrator.process({ leadId, organizationId, text, configuration, policy: configuration.qualification });
  }
}

/**
 * Coordinates the two agents: instant acknowledgement/question on intake,
 * then qualification + safe response on every inbound message.
 */
export class LeadAIAgentOrchestrator {
  constructor(
    private readonly leads: LeadStore,
    private readonly responses: LeadResponseAgent,
    private readonly qualification: LeadQualificationAgent,
  ) {}

  async onLeadCreated(lead: LeadRecord, configuration: ClientConfiguration, channel: MessageChannel = 'web'): Promise<LeadAgentResult> {
    const response = await this.responses.sendInitialResponse(lead, configuration, channel);
    return { lead, response, responseSent: true };
  }

  async onInboundMessage(input: {
    leadId: string;
    organizationId: string;
    text: string;
    configuration: ClientConfiguration;
    channel?: MessageChannel;
  }): Promise<LeadAgentResult> {
    const lead = await this.leads.get(input.leadId);
    if (!lead) throw new Error(`Lead not found: ${input.leadId}`);
    if (lead.organizationId !== input.organizationId) throw new Error('Tenant access denied');

    const result = await this.qualification.qualify(input.leadId, input.organizationId, input.text, input.configuration);
    const response = await this.responses.respondToDecision(lead, result.conversationDecision, result.nextQuestion, input.channel ?? 'web');
    return {
      lead: result.lead,
      response,
      responseSent: Boolean(response),
      qualification: result,
      decision: result.conversationDecision,
    };
  }
}
