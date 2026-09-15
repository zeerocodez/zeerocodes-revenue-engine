import type { QualificationResult } from '../domain/qualification';
import type { SdrDisposition, SdrWorkItem } from '../domain/sdr-work-item';
import type { RevenueRecoveryAttributionStore } from '../integrations/postgres-recovery-attribution';
import { createRevenueRecoveryAttribution } from '../domain/revenue-recovery-attribution';
import { RevenueRecordingService } from './revenue-recording-service';
import { SdrDispositionService } from './sdr-disposition-service';
import { SdrQueueService } from './sdr-queue-service';

export interface RevenueRecoveryInput {
  organizationId: string;
  workItemId: string;
  disposition: SdrDisposition;
  ownerId: string;
  appointmentStatus?: 'scheduled' | 'confirmed' | 'completed' | 'no_show' | 'cancelled';
  appointmentId?: string;
  qualification?: QualificationResult;
  outcomeRevenue?: number;
  currency?: string;
  leakageOpportunityId?: string;
  leakageType?: string;
  leakageValue?: number;
  recoverySource?: 'sdr' | 'closer' | 'ai' | 'other';
  now?: string;
}

export interface RevenueRecoveryResult {
  workItem: SdrWorkItem;
  disposition: SdrDisposition;
  lifecycleState: SdrWorkItem['leadState'];
  transitioned: boolean;
  revenueRecorded: boolean;
  revenueAmount: number;
  duplicateRevenue: boolean;
  recoveryAttributed: boolean;
}

export interface RevenueRecoveryTransaction { run<T>(work: () => Promise<T>): Promise<T>; }

/** Closes the recovery loop: lifecycle -> revenue -> attribution -> work-item completion. */
export class RevenueRecoveryService {
  constructor(
    private readonly queue: SdrQueueService,
    private readonly dispositionService: SdrDispositionService,
    private readonly revenueRecordingService: RevenueRecordingService,
    private readonly attributionStore?: RevenueRecoveryAttributionStore,
    private readonly transaction?: RevenueRecoveryTransaction,
  ) {}

  async recover(input: RevenueRecoveryInput): Promise<RevenueRecoveryResult> {
    const execute = () => this.recoverWithinTransaction(input);
    return this.transaction ? this.transaction.run(execute) : execute();
  }

  private async recoverWithinTransaction(input: RevenueRecoveryInput): Promise<RevenueRecoveryResult> {
    if (!input.organizationId) throw new Error('organizationId is required');
    if (!input.ownerId) throw new Error('ownerId is required');

    const revenueAmount = Math.max(0, Math.round(input.outcomeRevenue ?? 0));
    if (input.disposition === 'won') {
      if (revenueAmount <= 0) throw new Error('won recovery requires outcomeRevenue');
      if (!input.currency) throw new Error('won recovery requires currency');
      if (!this.attributionStore) throw new Error('won recovery requires attribution persistence');
      if (!input.leakageOpportunityId) throw new Error('won recovery requires leakageOpportunityId');
      if (!input.leakageType) throw new Error('won recovery requires leakageType');
      if (!Number.isFinite(input.leakageValue) || (input.leakageValue ?? 0) < 0) throw new Error('won recovery requires leakageValue');
    }

    const snapshot = await this.queue.queue(input.organizationId, input.now);
    const item = snapshot.items.find((candidate) => candidate.id === input.workItemId);
    if (!item) throw new Error('SDR work item not found or already completed');
    if (item.organizationId !== input.organizationId) throw new Error('Tenant access denied');
    if (item.status === 'open') await this.queue.claim(input.organizationId, item.id, input.ownerId);

    const current = (await this.queue.queue(input.organizationId, input.now)).items.find(
      (candidate) => candidate.id === input.workItemId,
    );
    if (!current) throw new Error('SDR work item disappeared during recovery');
    if (current.ownerId !== input.ownerId) throw new Error('SDR work item is assigned to another owner');

    const lifecycle = await this.dispositionService.apply({
      organizationId: input.organizationId,
      item: current,
      disposition: input.disposition,
      appointmentStatus: input.appointmentStatus,
      appointmentId: input.appointmentId,
      qualification: input.qualification,
      now: input.now,
    });

    let revenueRecorded = false;
    let duplicateRevenue = false;
    let recoveryAttributed = false;
    if (input.disposition === 'won') {
      const recording = await this.revenueRecordingService.record({
        id: `rev_${current.id}_won`, organizationId: input.organizationId, leadId: current.leadId,
        attributionType: 'recovered', amount: revenueAmount, currency: input.currency!, ownerId: input.ownerId,
        recordedAt: input.now, evidence: 'won-outcome', idempotencyKey: `recovery:${current.id}:won`,
      });
      revenueRecorded = true;
      duplicateRevenue = recording.duplicate;

      const attribution = createRevenueRecoveryAttribution({
        id: `recovery_attr_${current.id}_won`, organizationId: input.organizationId, leadId: current.leadId,
        leakageOpportunityId: input.leakageOpportunityId!, leakageType: input.leakageType!, ownerId: input.ownerId,
        recoveredAmount: revenueAmount, currency: input.currency!, leakageValue: input.leakageValue!,
        recoveredAt: input.now ?? new Date().toISOString(), recoverySource: input.recoverySource ?? 'sdr', evidence: 'won-outcome',
      });
      await this.attributionStore.save(attribution);
      recoveryAttributed = true;
    }

    const completed = await this.queue.complete(input.organizationId, current.id, input.disposition, {
      ownerId: input.ownerId, outcomeRevenue: revenueAmount || undefined,
    });
    return { workItem: completed, disposition: input.disposition, lifecycleState: lifecycle.state, transitioned: lifecycle.transitioned,
      revenueRecorded, revenueAmount, duplicateRevenue, recoveryAttributed };
  }
}
