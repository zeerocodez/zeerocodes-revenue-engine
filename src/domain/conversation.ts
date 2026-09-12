export type ConversationStatus = 'open' | 'waiting' | 'human' | 'closed';
export type ConversationOwner = 'ai' | 'sdr' | 'closer' | 'system';

export interface Conversation {
  id: string;
  organizationId: string;
  leadId: string;
  channel: 'whatsapp' | 'sms' | 'email' | 'voice' | 'web';
  status: ConversationStatus;
  owner: ConversationOwner;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
  metadata?: Record<string, unknown>;
}

export interface ConversationStore {
  get(id: string): Promise<Conversation | null>;
  getByLead(leadId: string): Promise<Conversation | null>;
  save(conversation: Conversation): Promise<void>;
}
