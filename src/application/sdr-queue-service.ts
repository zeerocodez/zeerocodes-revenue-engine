import { createSdrWorkItem, type SdrWorkItem, type SdrWorkItemInput } from '../domain/sdr-work-item';

export interface SdrWorkItemStore {
  list(organizationId: string): Promise<SdrWorkItem[]>;
  save(item: SdrWorkItem): Promise<void>;
  /** Optional atomic claim primitive used by production persistence adapters. */
  claim?(organizationId: string, itemId: string, ownerId: string): Promise<SdrWorkItem | null>;
}

export interface SdrQueueSnapshot {
  items: SdrWorkItem[];
  openCount: number;
  criticalCount: number;
  breachedCount: number;
}

export interface SdrCompletionMetadata {
  ownerId?: string;
  outcomeRevenue?: number;
}

export class SdrQueueService {
  constructor(private readonly store: SdrWorkItemStore) {}

  async enqueue(input: SdrWorkItemInput): Promise<SdrWorkItem> {
    const item = createSdrWorkItem(input);
    await this.store.save(item);
    return item;
  }

  async queue(organizationId: string, now = new Date().toISOString()): Promise<SdrQueueSnapshot> {
    const items = (await this.store.list(organizationId))
      .filter((item) => item.status === 'open' || item.status === 'claimed')
      .sort((a, b) => {
        const bandRank = { critical: 4, high: 3, medium: 2, low: 1 } as const;
        const bandDelta = bandRank[b.priorityBand] - bandRank[a.priorityBand];
        if (bandDelta !== 0) return bandDelta;
        const deadlineDelta = Date.parse(a.deadlineAt) - Date.parse(b.deadlineAt);
        if (deadlineDelta !== 0) return deadlineDelta;
        return b.priorityScore - a.priorityScore;
      });

    return {
      items,
      openCount: items.filter((item) => item.status === 'open').length,
      criticalCount: items.filter((item) => item.priorityBand === 'critical').length,
      breachedCount: items.filter((item) => Date.parse(now) > Date.parse(item.deadlineAt)).length,
    };
  }

  async claim(organizationId: string, itemId: string, ownerId: string): Promise<SdrWorkItem> {
    if (this.store.claim) {
      const claimed = await this.store.claim(organizationId, itemId, ownerId);
      if (!claimed) throw new Error('SDR work item is not open');
      return claimed;
    }

    const items = await this.store.list(organizationId);
    const item = items.find((candidate) => candidate.id === itemId);
    if (!item) throw new Error('SDR work item not found');
    if (item.organizationId !== organizationId) throw new Error('Tenant access denied');
    if (item.status !== 'open') throw new Error('SDR work item is not open');
    item.status = 'claimed';
    item.ownerId = ownerId;
    await this.store.save(item);
    return item;
  }

  async complete(
    organizationId: string,
    itemId: string,
    disposition: string,
    metadata: SdrCompletionMetadata = {},
  ): Promise<SdrWorkItem> {
    const items = await this.store.list(organizationId);
    const item = items.find((candidate) => candidate.id === itemId);
    if (!item) throw new Error('SDR work item not found');
    if (item.organizationId !== organizationId) throw new Error('Tenant access denied');
    if (!item.script || !item.dispositionOptions.includes(disposition as never)) throw new Error('Invalid disposition');
    if (item.status !== 'claimed' && item.status !== 'open') throw new Error('SDR work item is not active');
    item.status = 'completed';
    if (metadata.ownerId) item.ownerId = metadata.ownerId;
    if (metadata.outcomeRevenue !== undefined) item.outcomeRevenue = Math.max(0, Math.round(metadata.outcomeRevenue));
    item.completedAt = new Date().toISOString();
    item.disposition = disposition as SdrWorkItem['disposition'];
    item.recommendedAction = `Completed with disposition: ${disposition}`;
    await this.store.save(item);
    return item;
  }
}
