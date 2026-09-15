import { createRevenueAttribution, type RevenueAttributionEvent, type RevenueAttributionInput } from '../domain/revenue-attribution';

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

  async getByIdempotencyKey(organizationId: string, key: string): Promise<RevenueAttributionEvent | null> {
    if (!key) throw new Error('idempotencyKey is required');
    const existing = await this.store.getByIdempotencyKey(key);
    if (existing && existing.organizationId !== organizationId) throw new Error('Tenant access denied');
    return existing;
  }

  async record(input: RevenueRecordingInput): Promise<{ event: RevenueAttributionEvent; duplicate: boolean }> {
    if (!input.idempotencyKey) throw new Error('idempotencyKey is required');

    const existing = await this.getByIdempotencyKey(input.organizationId, input.idempotencyKey);
    if (existing) return { event: existing, duplicate: true };

    const event = createRevenueAttribution(input);
    if (event.organizationId !== input.organizationId) throw new Error('Tenant access denied');

    await this.store.save(event, input.idempotencyKey);
    return { event, duplicate: false };
  }
}
