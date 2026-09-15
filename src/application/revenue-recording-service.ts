import type { RevenueAttributionEvent, RevenueAttributionInput } from '../domain/revenue-attribution';

export interface RevenueRecordingStore {
  getById(id: string): Promise<RevenueAttributionEvent | null>;
  getByIdempotencyKey(key: string): Promise<RevenueAttributionEvent | null>;
  save(event: RevenueAttributionEvent, idempotencyKey: string): Promise<void>;
}

export interface RevenueRecordingInput extends RevenueAttributionInput {
  organizationId: string;
  idempotencyKey: string;
}

/** Application boundary for recording attributable revenue. */
export class RevenueRecordingService {
  constructor(private readonly store: RevenueRecordingStore) {}

  async record(input: RevenueRecordingInput): Promise<{ event: RevenueAttributionEvent; duplicate: boolean }> {
    if (!input.idempotencyKey) throw new Error('idempotencyKey is required');

    const existing = await this.store.getByIdempotencyKey(input.idempotencyKey);
    if (existing) {
      if (existing.organizationId !== input.organizationId) throw new Error('Tenant access denied');
      return { event: existing, duplicate: true };
    }

    const { createRevenueAttribution } = await import('../domain/revenue-attribution');
    const event = createRevenueAttribution(input);
    if (event.organizationId !== input.organizationId) throw new Error('Tenant access denied');

    await this.store.save(event, input.idempotencyKey);
    return { event, duplicate: false };
  }
}
