export type MessageDirection = 'inbound' | 'outbound';
export type MessageActor = 'lead' | 'ai' | 'sdr' | 'closer' | 'system';
export type MessageChannel = 'whatsapp' | 'sms' | 'email' | 'voice' | 'web';

export interface Message {
  id: string;
  organizationId: string;
  leadId: string;
  conversationId: string;
  direction: MessageDirection;
  actor: MessageActor;
  channel: MessageChannel;
  body: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface MessageStore {
  append(message: Message): Promise<void>;
  list(conversationId: string): Promise<Message[]>;
}
