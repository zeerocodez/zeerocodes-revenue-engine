import { describe, expect, it } from 'vitest';
import { RevenueRecoveryService } from '../../src/application/revenue-recovery-service';
import { SdrQueueService, type SdrWorkItemStore } from '../../src/application/sdr-queue-service';
import { SdrDispositionService } from '../../src/application/sdr-disposition-service';
import { LeadLifecycleService, type LeadLifecycleStore } from '../../src/application/lead-lifecycle-service';
import { RevenueRecordingService, type RevenueRecordingStore } from '../../src/application/revenue-recording-service';
import type { LeadRecord } from '../../src/domain/lead';
import type { RevenueAttributionEvent } from '../../src/domain/revenue-attribution';
import type { SdrWorkItem } from '../../src/domain/sdr-work-item';

function item(): SdrWorkItem {
  return {
    id: 'work_1', organizationId: 'org_1', leadId: 'lead_1', leadName: 'Ada', priorityScore: 90,
    priorityBand: 'critical', action: 'call-now', whyNow: 'Purchase intent', leadState: 'qualified',
    recommendedAction: 'Call now', deadlineAt: '2026-09-15T08:05:00.000Z', slaMinutes: 5, slaBreached: false,
    script: { opening: 'Hello', objective: 'qualify', qualificationQuestions: [], objectionResponses: [], closing: 'Next step?' },
    dispositionOptions: ['connected', 'won', 'lost'], status: 'claimed', ownerId: 'owner_a',
    createdAt: '2026-09-15T08:00:00.000Z',
  };
}

class WorkStore implements SdrWorkItemStore { constructor(public items = [item()]) {} async list() { return this.items; } async save(i: SdrWorkItem) { this.items = this.items.map(x => x.id === i.id ? i : x); } }
class LeadStore implements LeadLifecycleStore { private lead: LeadRecord = { id: 'lead_1', organizationId: 'org_1', name: 'Ada', state: 'qualified', createdAt: '2026-09-15T08:00:00.000Z', updatedAt: '2026-09-15T08:00:00.000Z' }; async get() { return this.lead; } async save(l: LeadRecord) { this.lead = l; } }
class RevenueStore implements RevenueRecordingStore { async getById(): Promise<RevenueAttributionEvent | null> { return null; } async getByIdempotencyKey(): Promise<RevenueAttributionEvent | null> { return null; } async save() {} }

describe('RevenueRecoveryService ownership', () => {
  it('rejects a claimed work item owned by another SDR', async () => {
    const queue = new SdrQueueService(new WorkStore());
    const lifecycle = new LeadLifecycleService(new LeadStore());
    const service = new RevenueRecoveryService(queue, new SdrDispositionService(lifecycle), new RevenueRecordingService(new RevenueStore()));
    await expect(service.recover({ organizationId: 'org_1', workItemId: 'work_1', disposition: 'lost', ownerId: 'owner_b' }))
      .rejects.toThrow('assigned to another owner');
  });
});
