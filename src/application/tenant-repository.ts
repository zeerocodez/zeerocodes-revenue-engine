import type { Conversation, ConversationStore } from '../domain/conversation';
import type { LeadEvent, LeadEventStore } from '../domain/lead-events';
import type { LeadRecord } from '../domain/lead';
import type { Message, MessageStore } from '../domain/message';
import type { LeadStore } from './revenue-engine-service';

export interface TenantLeadRepository extends LeadStore {
  getForTenant(id: string, organizationId: string): Promise<LeadRecord | null>;
}

export class TenantLeadRepositoryImpl implements TenantLeadRepository {
  constructor(private readonly delegate: LeadStore) {}

  get(id: string) { return this.delegate.get(id); }
  save(lead: LeadRecord) {
    if (!lead.organizationId) throw new Error('Lead tenant is required');
    return this.delegate.save(lead);
  }
  list(organizationId: string) { return this.delegate.list(organizationId); }

  async getForTenant(id: string, organizationId: string) {
    const lead = await this.delegate.get(id);
    if (!lead || lead.organizationId !== organizationId) return null;
    return lead;
  }
}

export interface TenantConversationRepository extends ConversationStore {
  getForTenant(id: string, organizationId: string): Promise<Conversation | null>;
  getByLeadForTenant(leadId: string, organizationId: string): Promise<Conversation | null>;
}

export class TenantConversationRepositoryImpl implements TenantConversationRepository {
  constructor(private readonly delegate: ConversationStore) {}

  get(id: string) { return this.delegate.get(id); }
  save(conversation: Conversation) {
    if (!conversation.organizationId) throw new Error('Conversation tenant is required');
    return this.delegate.save(conversation);
  }
  getByLead(leadId: string) { return this.delegate.getByLead(leadId); }

  async getForTenant(id: string, organizationId: string) {
    const conversation = await this.delegate.get(id);
    if (!conversation || conversation.organizationId !== organizationId) return null;
    return conversation;
  }

  async getByLeadForTenant(leadId: string, organizationId: string) {
    const conversation = await this.delegate.getByLead(leadId);
    if (!conversation || conversation.organizationId !== organizationId) return null;
    return conversation;
  }
}

export interface TenantMessageRepository extends MessageStore {
  listForTenant(conversationId: string, organizationId: string): Promise<Message[]>;
}

export class TenantMessageRepositoryImpl implements TenantMessageRepository {
  constructor(private readonly delegate: MessageStore) {}

  async append(message: Message) {
    if (!message.organizationId) throw new Error('Message tenant is required');
    return this.delegate.append(message);
  }

  list(conversationId: string) { return this.delegate.list(conversationId); }

  async listForTenant(conversationId: string, organizationId: string) {
    const messages = await this.delegate.list(conversationId);
    return messages.filter((message) => message.organizationId === organizationId);
  }
}

export interface TenantLeadEventRepository extends LeadEventStore {
  listForTenant(leadId: string, organizationId: string): Promise<LeadEvent[]>;
}

export class TenantLeadEventRepositoryImpl implements TenantLeadEventRepository {
  constructor(private readonly delegate: LeadEventStore) {}

  async append(event: LeadEvent) {
    if (!event.organizationId) throw new Error('Event tenant is required');
    return this.delegate.append(event);
  }

  list(leadId: string) { return this.delegate.list(leadId); }

  async listForTenant(leadId: string, organizationId: string) {
    const events = await this.delegate.list(leadId);
    return events.filter((event) => event.organizationId === organizationId);
  }
}
