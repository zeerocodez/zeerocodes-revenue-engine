import { describe, expect, it } from 'vitest';
import { RevenueRecordingService, type RevenueRecordingStore } from '../../src/application/revenue-recording-service';
import type { RevenueAttributionEvent } from '../../src/domain/revenue-attribution';

class MemoryRevenueStore implements RevenueRecordingStore {
  events = new Map<string, RevenueAttributionEvent>();
  keys = new Map<string, RevenueAttributionEvent>();

  async getById(id: string) { return this.events.get(id) ?? null; }
  async getByIdempotencyKey(key: string) { return this.keys.get(key) ?? null; }
  async save(event: RevenueAttributionEvent, idempotencyKey: string) {
    this.events.set(event.id, event);
    this.keys.set(idempotencyKey, event);
  }
}

const input = {
  organizationId: 'org-1',
  leadId: 'lead-1',
  id: 'evt-1',
  idempotencyKey: 'won-lead-1',
  amount: 250000,
  currency: 'NGN',
  attributionType: 'direct' as const,
  evidence: 'won-outcome' as const,
};

describe('RevenueRecordingService', () => {
  it('records a revenue event once and returns the existing event on retry', async () => {
    const store = new MemoryRevenueStore();
    const service = new RevenueRecordingService(store);

    const first = await service.record(input);
    const second = await service.record(input);

    expect(first.duplicate).toBe(false);
    expect(second.duplicate).toBe(true);
    expect(second.event).toEqual(first.event);
    expect(store.events.size).toBe(1);
  });

  it('rejects cross-tenant reuse of an idempotency key', async () => {
    const store = new MemoryRevenueStore();
    const service = new RevenueRecordingService(store);
    await service.record(input);

    await expect(service.record({ ...input, organizationId: 'org-2' }))
      .rejects.toThrow('Tenant access denied');
  });

  it('rejects missing idempotency keys', async () => {
    const service = new RevenueRecordingService(new MemoryRevenueStore());
    await expect(service.record({ ...input, idempotencyKey: '' }))
      .rejects.toThrow('idempotencyKey is required');
  });
});
