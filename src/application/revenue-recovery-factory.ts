import type { LeadEventStore, LeadStore } from './revenue-engine-service';
import { RevenueRecordingService } from './revenue-recording-service';
import { RevenueRecoveryService } from './revenue-recovery-service';
import { SdrDispositionService } from './sdr-disposition-service';
import { SdrQueueService } from './sdr-queue-service';
import type { SdrWorkItem } from '../domain/sdr-work-item';

/**
 * Composition boundary for the revenue recovery loop. Persistence adapters
 * remain behind the existing application services; the HTTP layer only needs
 * this factory and never reaches into stores directly.
 */
export function createRevenueRecoveryService(
  workItems: SdrWorkItem[],
  leadStore: LeadStore,
  leadEventStore: LeadEventStore,
): RevenueRecoveryService {
  const queue = new SdrQueueService(workItems);
  const lifecycle = new (require('./lead-lifecycle-service').LeadLifecycleService)(leadStore, leadEventStore);
  const disposition = new SdrDispositionService(lifecycle);
  const revenueStore = {
    async getById() { return null; },
    async getByIdempotencyKey() { return null; },
    async save() {},
  };
  return new RevenueRecoveryService(queue, disposition, new RevenueRecordingService(revenueStore));
}
