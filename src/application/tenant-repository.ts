import type { Conversation, ConversationStore } from '../domain/conversation';
import type { LeadEvent, LeadEventStore } from '../domain/lead-events';
import type { LeadRecord } from '../domain/lead';
import type { Message, MessageStore } from '../domain/message';
import type { LeadStore } from './revenue-engine-service';

export interface TenantScopedLeadRepository extends LeadStore {
  getForTenant(id: string, organizationId: string): Promise<LeadRecord | null>;
}

export interface TenantScopedConversationRepository extends ConversationStore {
  getForTenant(id: string, organizationId: string): Promise<Conversation | null>;
  getByLeadForTenant(leadId: string, organizationId: string): Promise<Conversation | null>;
}

export interface TenantScopedMessageRepository extends MessageStore {
  listForTenant(conversationId: string, organizationId: string): Promise<Message[]>;
}

export interface TenantScopedLeadEventRepository extends LeadEventStore {
  listForTenant(leadId: string, organizationId: string): Promise<LeadEvent[]>;
}

export class TenantRepository implements TenantScopedLeadRepository, TenantScopedConversationRepository, TenantScopedMessageRepository, TenantScopedLeadEventRepository {
  constructor(
    private readonly leads: LeadStore,
    private readonly conversations: ConversationStore,
    private readonly messages: MessageStore,
    private readonly events: LeadEventStore,
  ) {}

  async get(id: string) { return this.leads.get(id); }
  async getForTenant(id: string, organizationId: string) {
    const lead = await this.leads.get(id);
    if (!lead || lead.organizationId !== organizationId) return null;
    return lead;
  }
  async save(lead: LeadRecord) { return this.leads.save(lead); }
  async list(organizationId: string) { return this.leads.list(organizationId); }

  async getConversation(id: string) { return this.conversations.get(id); }
  async getForTenant(id: string, organizationId: string) {
    const conversation = await this.conversations.get(id);
    if (!conversation || conversation.organizationId !== organizationId) return null;
    return conversation;
  }
  async getByLead(leadId: string) { return this.conversations.getByLead(leadId); }
  async getByLeadForTenant(leadId: string, organizationId: string) {
    const conversation = await this.conversations.getByLead(leadId);
    if (!conversation || conversation.organizationId !== organizationId) return null;
    return conversation;
  }
  async saveConversation(conversation: Conversation) { return this.conversations.save(conversation); }

  async append(message: Message) { return this.messages.append(message); }
  async list(conversationId: string) { return this.messages.list(conversationId); }
  async listForTenant(conversationId: string, organizationId: string) {
    const messages = await this.messages.list(conversationId);
    return messages.filter((message) => message.organizationId === organizationId);
  }

  async appendEvent(event: LeadEvent) { return this.events.append(event); }
  async listEvents(leadId: string) { return this.events.list(leadId); }
  async listForTenant(leadId: string, organizationId: string) {
    const events = await this.events.list(leadId);
    return events.filter((event) => event.organizationId === organizationId);
  }
}
