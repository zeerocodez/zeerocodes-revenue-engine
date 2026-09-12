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
    expect((await service.getConversation('lead_1', 'org_1')).messages).toHaveLength(1);
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

  it('blocks cross-tenant message writes', async () => {
    const leads = new MemoryLeadStore();
    await leads.save({
      id: 'lead_3',
      organizationId: 'org_a',
      name: 'Chioma',
      state: 'contacting',
      profile: {},
      consent: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const service = new ConversationService(leads, new MemoryConversationStore(), new MemoryMessageStore());
    await expect(service.sendMessage({ leadId: 'lead_3', organizationId: 'org_b', body: 'hello', actor: 'lead' })).rejects.toThrow('Tenant access denied');
  });

  it('blocks cross-tenant conversation reads', async () => {
    const leads = new MemoryLeadStore();
    const conversations = new MemoryConversationStore();
    const messages = new MemoryMessageStore();
    const service = new ConversationService(leads, conversations, messages);

    await leads.save({
      id: 'lead_4',
      organizationId: 'org_a',
      name: 'Tunde',
      state: 'contacting',
      profile: {},
      consent: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await service.sendMessage({ leadId: 'lead_4', organizationId: 'org_a', body: 'hello', actor: 'lead' });

    await expect(service.getConversation('lead_4', 'org_b')).rejects.toThrow('Tenant access denied');
  });
});
