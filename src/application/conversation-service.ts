import type { Conversation, ConversationStore } from '../domain/conversation';
import type { Message, MessageActor, MessageChannel, MessageStore } from '../domain/message';
import type { LeadStore } from './revenue-engine-service';

function id(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export interface SendMessageInput {
  leadId: string;
  organizationId: string;
  body: string;
  channel?: MessageChannel;
  actor?: MessageActor;
}

export class ConversationService {
  constructor(
    private readonly leads: LeadStore,
    private readonly conversations: ConversationStore,
    private readonly messages: MessageStore,
  ) {}

  async sendMessage(input: SendMessageInput): Promise<{ conversation: Conversation; message: Message }> {
    const lead = await this.leads.get(input.leadId);
    if (!lead) throw new Error(`Lead not found: ${input.leadId}`);
    if (!input.body.trim()) throw new Error('Message body is required');

    const now = new Date().toISOString();
    let conversation = await this.conversations.getByLead(input.leadId);
    if (!conversation) {
      conversation = {
        id: id('conv'),
        organizationId: input.organizationId,
        leadId: input.leadId,
        channel: input.channel ?? 'web',
        status: input.actor === 'lead' ? 'open' : 'waiting',
        owner: input.actor === 'lead' ? 'ai' : (input.actor === 'closer' ? 'closer' : input.actor === 'sdr' ? 'sdr' : 'ai'),
        createdAt: now,
        updatedAt: now,
      };
    }

    const actor = input.actor ?? 'ai';
    conversation.channel = input.channel ?? conversation.channel;
    conversation.updatedAt = now;
    conversation.lastMessageAt = now;
    conversation.status = actor === 'lead' ? 'open' : actor === 'ai' ? 'waiting' : 'human';
    conversation.owner = actor === 'lead' || actor === 'system' ? conversation.owner : actor;

    const message: Message = {
      id: id('msg'),
      organizationId: input.organizationId,
      leadId: input.leadId,
      conversationId: conversation.id,
      direction: actor === 'lead' ? 'inbound' : 'outbound',
      actor,
      channel: conversation.channel,
      body: input.body.trim(),
      timestamp: now,
    };

    await this.conversations.save(conversation);
    await this.messages.append(message);
    return { conversation, message };
  }

  async getConversation(leadId: string) {
    const conversation = await this.conversations.getByLead(leadId);
    if (!conversation) return { conversation: null, messages: [] as Message[] };
    return { conversation, messages: await this.messages.list(conversation.id) };
  }
}
