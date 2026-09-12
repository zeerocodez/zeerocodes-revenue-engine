import { describe, expect, it } from 'vitest';
import { TenantConversationRepositoryImpl, TenantLeadEventRepositoryImpl, TenantLeadRepositoryImpl, TenantMessageRepositoryImpl } from '../../src/application/tenant-repository';
import { MemoryLeadStore } from '../../src/integrations/memory-lead-store';
import { MemoryConversationStore, MemoryMessageStore } from '../../src/integrations/memory-messaging';
import { MemoryLeadEventStore } from '../../src/integrations/memory-lead-events';

describe('tenant repository boundary', () => {
  it('prevents cross-tenant lead reads', async () => {
    const store = new TenantLeadRepositoryImpl(new MemoryLeadStore());
    await store.save({ id: 'lead-a', organizationId: 'tenant-a', name: 'A', state: 'new', profile: {}, consent: true, createdAt: '', updatedAt: '' });

    expect(await store.getForTenant('lead-a', 'tenant-a')).not.toBeNull();
    expect(await store.getForTenant('lead-a', 'tenant-b')).toBeNull();
    expect(await store.list('tenant-b')).toEqual([]);
  });

  it('filters conversations by tenant', async () => {
    const base = new MemoryConversationStore();
    const store = new TenantConversationRepositoryImpl(base);
    await store.save({ id: 'conv-a', organizationId: 'tenant-a', leadId: 'lead-a', channel: 'web', status: 'open', owner: 'ai', createdAt: '', updatedAt: '' });

    expect(await store.getForTenant('conv-a', 'tenant-a')).not.toBeNull();
    expect(await store.getForTenant('conv-a', 'tenant-b')).toBeNull();
  });

  it('filters messages by tenant', async () => {
    const base = new MemoryMessageStore();
    const store = new TenantMessageRepositoryImpl(base);
    await store.append({ id: 'msg-a', organizationId: 'tenant-a', leadId: 'lead-a', conversationId: 'conv-a', direction: 'inbound', actor: 'lead', channel: 'web', body: 'hello', timestamp: '' });
    await store.append({ id: 'msg-b', organizationId: 'tenant-b', leadId: 'lead-b', conversationId: 'conv-a', direction: 'inbound', actor: 'lead', channel: 'web', body: 'hello', timestamp: '' });

    expect((await store.listForTenant('conv-a', 'tenant-a')).map((m) => m.id)).toEqual(['msg-a']);
  });

  it('filters lead events by tenant', async () => {
    const base = new MemoryLeadEventStore();
    const store = new TenantLeadEventRepositoryImpl(base);
    await store.append({ id: 'evt-a', leadId: 'lead-a', organizationId: 'tenant-a', type: 'lead.created', actor: 'system', timestamp: '' });
    await store.append({ id: 'evt-b', leadId: 'lead-a', organizationId: 'tenant-b', type: 'lead.created', actor: 'system', timestamp: '' });

    expect((await store.listForTenant('lead-a', 'tenant-a')).map((e) => e.id)).toEqual(['evt-a']);
  });
});
