import type { MessageChannel } from '../domain/message';
import type { LeadStore } from './revenue-engine-service';
import { ConversationService } from './conversation-service';
import { QualificationOrchestrator } from './qualification-orchestrator';
import type { ClientConfiguration } from '../domain/client-configuration';

export interface InboundMessageInput {
  organizationId: string;
  leadId: string;
  body: string;
  channel: MessageChannel;
  externalMessageId?: string;
}

export interface InboundMessageResult {
  leadId: string;
  decision?: unknown;
  reply?: string;
  duplicate: boolean;
}

export class InboundMessageService {
  constructor(
    private readonly leads: LeadStore,
    private readonly conversations: ConversationService,
    private readonly qualification: QualificationOrchestrator,
    private readonly configurationProvider: { get(organizationId: string): Promise<ClientConfiguration> },
  ) {}

  async process(input: InboundMessageInput): Promise<InboundMessageResult> {
    const lead = await this.leads.get(input.leadId);
    if (!lead) throw new Error(`Lead not found: ${input.leadId}`);
    if (lead.organizationId !== input.organizationId) throw new Error('Tenant access denied');
    if (!input.body.trim()) throw new Error('Message body is required');

    const metadata = lead.metadata ?? {};
    const seen = Array.isArray(metadata.inboundMessageIds) ? metadata.inboundMessageIds.filter((v): v is string => typeof v === 'string') : [];
    if (input.externalMessageId && seen.includes(input.externalMessageId)) {
      return { leadId: lead.id, duplicate: true };
    }

    await this.conversations.sendMessage({
      organizationId: input.organizationId,
      leadId: lead.id,
      body: input.body,
      channel: input.channel,
      actor: 'lead',
    });

    if (input.externalMessageId) {
      metadata.inboundMessageIds = [...seen.slice(-99), input.externalMessageId];
      lead.metadata = metadata;
      lead.updatedAt = new Date().toISOString();
      await this.leads.save(lead);
    }

    const configuration = await this.configurationProvider.get(input.organizationId);
    const result = await this.qualification.process({
      leadId: lead.id,
      organizationId: input.organizationId,
      text: input.body,
      configuration,
      policy: configuration.qualification,
    });

    return {
      leadId: lead.id,
      decision: result.decision,
      reply: result.nextQuestion,
      duplicate: false,
    };
  }
}
