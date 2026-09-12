import type { Message, MessageStore } from '../domain/message';
import type { Conversation, ConversationStore } from '../domain/conversation';

export class MemoryMessageStore implements MessageStore {
  private readonly messages: Message[] = [];

  async append(message: Message): Promise<void> {
    this.messages.push(structuredClone(message));
  }

  async list(conversationId: string): Promise<Message[]> {
    return this.messages
      .filter((message) => message.conversationId === conversationId)
      .map((message) => structuredClone(message));
  }
}

export class MemoryConversationStore implements ConversationStore {
  private readonly conversations: Conversation[] = [];

  async get(id: string): Promise<Conversation | null> {
    const conversation = this.conversations.find((item) => item.id === id);
    return conversation ? structuredClone(conversation) : null;
  }

  async getByLead(leadId: string): Promise<Conversation | null> {
    const conversation = this.conversations.find((item) => item.leadId === leadId);
    return conversation ? structuredClone(conversation) : null;
  }

  async save(conversation: Conversation): Promise<void> {
    const index = this.conversations.findIndex((item) => item.id === conversation.id);
    if (index >= 0) this.conversations[index] = structuredClone(conversation);
    else this.conversations.push(structuredClone(conversation));
  }
}
