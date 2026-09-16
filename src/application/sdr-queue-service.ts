import { createSdrWorkItem, type SdrWorkItem, type SdrWorkItemInput } from '../domain/sdr-work-item';

export interface SdrWorkItemStore {
  list(organizationId: string): Promise<SdrWorkItem[]>;
  save(item: SdrWorkItem): Promise<void>;
  getSdrWorkItem?(organizationId: string, id: string): Promise<SdrWorkItem | null>;
  claimSdrWorkItemAtomic?(organizationId: string, id: string, ownerId: string, claimedAt?: string): Promise<SdrWorkItem | null>;
  completeSdrWorkItem?(organizationId: string, id: string, disposition: string, outcomeRevenue?: number, completedBy?: string, completedAt?: string): Promise<SdrWorkItem | null>;
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
    if (!organizationId?.trim()) throw new Error('organizationId is required');

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

  async claim(organizationId: string, itemId: string, ownerId: string, now = new Date().toISOString()): Promise<SdrWorkItem> {
    if (!organizationId?.trim()) throw new Error('organizationId is required');
    if (!itemId?.trim()) throw new Error('itemId is required');
    if (!ownerId?.trim()) throw new Error('ownerId is required');

    if (this.store.claimSdrWorkItemAtomic) {
      const claimed = await this.store.claimSdrWorkItemAtomic(organizationId, itemId, ownerId, now);
      if (!claimed) {
        const item = this.store.getSdrWorkItem ? await this.store.getSdrWorkItem(organizationId, itemId) : null;
        if (!item) throw new Error('SDR work item not found');
        if (item.organizationId !== organizationId) throw new Error('Tenant access denied');
        throw new Error('SDR work item is not open');
      }
      return claimed;
    }

    const items = await this.store.list(organizationId);
    const item = items.find((candidate) => candidate.id === itemId);
    if (!item) throw new Error('SDR work item not found');
    if (item.organizationId !== organizationId) throw new Error('Tenant access denied');
    if (item.status !== 'open') throw new Error('SDR work item is not open');
    item.status = 'claimed';
    item.ownerId = ownerId;
    item.claimedAt = now;
    await this.store.save(item);
    return item;
  }

  async complete(
    organizationId: string,
    itemId: string,
    disposition: string,
    completedByOrMetadata?: string | SdrCompletionMetadata,
    outcomeRevenue?: number,
    now = new Date().toISOString(),
  ): Promise<SdrWorkItem> {
    if (!organizationId?.trim()) throw new Error('organizationId is required');
    if (!itemId?.trim()) throw new Error('itemId is required');

    let completedBy: string | undefined;
    let revenue: number | undefined = outcomeRevenue;
    let completedAt = now;

    if (typeof completedByOrMetadata === 'object' && completedByOrMetadata !== null) {
      completedBy = completedByOrMetadata.ownerId;
      if (completedByOrMetadata.outcomeRevenue !== undefined) {
        revenue = Math.max(0, Math.round(completedByOrMetadata.outcomeRevenue));
      }
    } else {
      completedBy = completedByOrMetadata;
    }

    if (this.store.completeSdrWorkItem) {
      const completed = await this.store.completeSdrWorkItem(
        organizationId,
        itemId,
        disposition,
        revenue,
        completedBy,
        completedAt,
      );
      if (completed) return completed;
    }

    const items = await this.store.list(organizationId);
    const item = items.find((candidate) => candidate.id === itemId);
    if (!item) throw new Error('SDR work item not found');
    if (item.organizationId !== organizationId) throw new Error('Tenant access denied');
    if (!item.script || !item.dispositionOptions.includes(disposition as never)) throw new Error('Invalid disposition');
    if (item.status !== 'claimed' && item.status !== 'open') throw new Error('SDR work item is not active');
    item.status = 'completed';
    item.disposition = disposition as any;
    if (completedBy) item.ownerId = completedBy;
    item.completedBy = completedBy;
    if (revenue !== undefined) item.outcomeRevenue = Math.max(0, Math.round(revenue));
    item.completedAt = completedAt;
    item.recommendedAction = `Completed with disposition: ${disposition}`;
    await this.store.save(item);
    return item;
  }
}
