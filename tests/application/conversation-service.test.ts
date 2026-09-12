import { describe, expect, it } from 'vitest';
import { ConversationService } from '../../src/application/conversation-service';
import { MemoryConversationStore, MemoryMessageStore } from '../../src/integrations/memory-messaging';
import { MemoryLeadStore } from '../../src/integrations/memory-lead-store';

describe('ConversationService', () => {
  it('creates a conversation and records an inbound message', async () => {
    const leads = new MemoryLeadStore();
    const conversations = new MemoryConversationStore();
    const messages = new MemoryMessageStore();
    const service = new ConversationService(leads, conversations, messages);

    await leads.save({
      id: 'lead_1',
      organizationId: 'org_1',
      name: 'Ada',
      state: 'contacting',
      profile: {},
      consent: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const result = await service.sendMessage({
      leadId: 'lead_1',
      organizationId: 'org_1',
      body: 'I am interested',
      channel: 'whatsapp',
      actor: 'lead',
    });

    expect(result.conversation.status).toBe('open');
    expect(result.conversation.owner).toBe('ai');
    expect(result.message.direction).toBe('inbound');
    expect((await service.getConversation('lead_1')).messages).toHaveLength(1);
  });

  it('rejects blank messages', async () => {
    const leads = new MemoryLeadStore();
    await leads.save({
      id: 'lead_2',
      organizationId: 'org_1',
      name: 'Bola',
      state: 'contacting',
      profile: {},
      consent: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const service = new ConversationService(leads, new MemoryConversationStore(), new MemoryMessageStore());
    await expect(service.sendMessage({ leadId: 'lead_2', organizationId: 'org_1', body: '   ' })).rejects.toThrow('Message body is required');
  });
});
