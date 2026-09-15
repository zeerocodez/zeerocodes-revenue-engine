import { describe, expect, it } from 'vitest';
import { RevenueRecoveryService } from '../../src/application/revenue-recovery-service';
import { SdrDispositionService } from '../../src/application/sdr-disposition-service';
import { SdrQueueService } from '../../src/application/sdr-queue-service';
import { RevenueRecordingService } from '../../src/application/revenue-recording-service';

function workItem() {
  return {
    id: 'wi_tx', organizationId: 'org_1', leadId: 'lead_1', leadName: 'Ada', priorityScore: 90,
    priorityBand: 'critical' as const, action: 'handoff-closer' as const, whyNow: 'Purchase intent',
    leadState: 'booked' as const, recommendedAction: 'Close now', deadlineAt: '2026-09-15T09:00:00.000Z',
    slaMinutes: 5, slaBreached: false, script: { opening: 'Hello', objective: 'Close', qualificationQuestions: [], objectionResponses: [], closing: 'Shall we proceed?' },
    dispositionOptions: ['won'] as const, createdAt: '2026-09-15T08:00:00.000Z', status: 'claimed' as const, ownerId: 'user_1',
  };
}

describe('RevenueRecoveryService transaction boundary', () => {
  it('executes the complete recovery inside the supplied transaction', async () => {
    let calls = 0;
    const queueStore = {
      list: async () => [workItem()],
      save: async () => undefined,
    };
    const queue = new SdrQueueService(queueStore);
    const lifecycle = { apply: async () => ({ disposition: 'won' as const, transitioned: true, state: 'won' as const, lifecycleReason: 'won' }) };
    const revenue = { record: async () => ({ event: {} as never, duplicate: false }) };
    const transaction = { run: async <T>(work: () => Promise<T>) => { calls += 1; return work(); } };
    const service = new RevenueRecoveryService(queue, lifecycle as unknown as SdrDispositionService, revenue as unknown as RevenueRecordingService, transaction);

    const result = await service.recover({ organizationId: 'org_1', workItemId: 'wi_tx', disposition: 'won', ownerId: 'user_1', outcomeRevenue: 500000, currency: 'NGN' });
    expect(result.revenueRecorded).toBe(true);
    expect(calls).toBe(1);
  });
});
