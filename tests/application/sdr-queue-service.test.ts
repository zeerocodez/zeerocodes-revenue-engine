import { describe, expect, it } from 'vitest';
import { SdrQueueService } from '../../src/application/sdr-queue-service';
import type { SdrWorkItem } from '../../src/domain/sdr-work-item';

class MemorySdrStore {
  items: SdrWorkItem[] = [];
  async list(organizationId: string) { return this.items.filter((item) => item.organizationId === organizationId); }
  async save(item: SdrWorkItem) {
    const index = this.items.findIndex((candidate) => candidate.id === item.id);
    if (index >= 0) this.items[index] = item; else this.items.push(item);
  }
}

const input = {
  organizationId: 'org_1', leadId: 'lead_1', leadName: 'Ada', leadState: 'qualified' as const,
  priorityScore: 92, priorityBand: 'critical' as const, nextAction: 'closer-call-now' as const,
  reason: 'purchase intent', slaBreached: false, now: '2026-09-14T10:00:00.000Z',
};

describe('SDR queue service', () => {
  it('enqueues a work item', async () => {
    const store = new MemorySdrStore();
    const service = new SdrQueueService(store);
    const item = await service.enqueue(input);
    expect(item.leadId).toBe('lead_1');
    expect(store.items).toHaveLength(1);
  });

  it('sorts critical opportunities before lower-priority work', async () => {
    const store = new MemorySdrStore();
    const service = new SdrQueueService(store);
    await service.enqueue(input);
    await service.enqueue({ ...input, leadId: 'lead_2', leadName: 'Bola', priorityScore: 80, priorityBand: 'high', nextAction: 'sdr-call-now', reason: 'qualified follow-up' });
    const queue = await service.queue('org_1', '2026-09-14T10:01:00.000Z');
    expect(queue.items.map((item) => item.leadId)).toEqual(['lead_1', 'lead_2']);
    expect(queue.criticalCount).toBe(1);
  });

  it('enforces tenant isolation on claim', async () => {
    const store = new MemorySdrStore();
    const service = new SdrQueueService(store);
    const item = await service.enqueue(input);
    await expect(service.claim('org_2', item.id, 'sdr_1')).rejects.toThrow('SDR work item not found');
  });

  it('allows an SDR to claim and complete a work item', async () => {
    const store = new MemorySdrStore();
    const service = new SdrQueueService(store);
    const item = await service.enqueue(input);
    const claimed = await service.claim('org_1', item.id, 'sdr_1');
    expect(claimed.status).toBe('claimed');
    const completed = await service.complete('org_1', item.id, 'appointment-booked');
    expect(completed.status).toBe('completed');
  });

  it('rejects an invalid disposition', async () => {
    const store = new MemorySdrStore();
    const service = new SdrQueueService(store);
    const item = await service.enqueue(input);
    await expect(service.complete('org_1', item.id, 'made-up')).rejects.toThrow('Invalid disposition');
  });
});
