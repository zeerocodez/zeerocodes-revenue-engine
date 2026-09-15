import { RevenueRecoveryService, type RevenueRecoveryTransaction } from './revenue-recovery-service';
import { SdrDispositionService } from './sdr-disposition-service';
import { SdrQueueService, type SdrWorkItemStore } from './sdr-queue-service';
import { RevenueRecordingService, type RevenueRecordingStore } from './revenue-recording-service';
import { LeadLifecycleService } from './lead-lifecycle-service';
import type { LeadEventStore } from '../domain/lead-events';
import type { LeadStore } from './revenue-engine-service';
import type { RevenueRecoveryAttributionStore } from '../integrations/postgres-recovery-attribution';

interface TransactionAwareWorkItemStore extends SdrWorkItemStore {
  transaction?: RevenueRecoveryTransaction;
}

export interface RevenueRecoveryDependencies {
  workItems: TransactionAwareWorkItemStore;
  leadStore: LeadStore;
  leadEventStore: LeadEventStore;
  revenueStore: RevenueRecordingStore;
  attributionStore?: RevenueRecoveryAttributionStore;
  transaction?: RevenueRecoveryTransaction;
}

/** Composition boundary for the production recovery loop. */
export function createRevenueRecoveryService(dependencies: RevenueRecoveryDependencies): RevenueRecoveryService {
  const queue = new SdrQueueService(dependencies.workItems);
  const lifecycle = new LeadLifecycleService(dependencies.leadStore, dependencies.leadEventStore);
  const disposition = new SdrDispositionService(lifecycle);
  const revenue = new RevenueRecordingService(dependencies.revenueStore);
  const transaction = dependencies.transaction ?? dependencies.workItems.transaction;
  return new RevenueRecoveryService(queue, disposition, revenue, dependencies.attributionStore, transaction);
}
