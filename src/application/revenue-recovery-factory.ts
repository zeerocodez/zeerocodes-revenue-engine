import { RevenueRecoveryService, type RevenueRecoveryTransaction } from './revenue-recovery-service';
import { SdrDispositionService } from './sdr-disposition-service';
import { SdrQueueService, type SdrWorkItemStore } from './sdr-queue-service';
import { RevenueRecordingService, type RevenueRecordingStore } from './revenue-recording-service';
import { LeadLifecycleService } from './lead-lifecycle-service';
import type { LeadEventStore } from '../domain/lead-events';
import type { LeadStore } from './revenue-engine-service';

export interface RevenueRecoveryDependencies {
  workItems: SdrWorkItemStore;
  leadStore: LeadStore;
  leadEventStore: LeadEventStore;
  revenueStore: RevenueRecordingStore;
  transaction?: RevenueRecoveryTransaction;
}

/** Composition boundary for the production recovery loop. */
export function createRevenueRecoveryService(dependencies: RevenueRecoveryDependencies): RevenueRecoveryService {
  const queue = new SdrQueueService(dependencies.workItems);
  const lifecycle = new LeadLifecycleService(dependencies.leadStore, dependencies.leadEventStore);
  const disposition = new SdrDispositionService(lifecycle);
  const revenue = new RevenueRecordingService(dependencies.revenueStore);
  return new RevenueRecoveryService(queue, disposition, revenue, dependencies.transaction);
}
