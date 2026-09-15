import type { QualificationResult } from '../domain/qualification';
import type { SdrDisposition, SdrWorkItem } from '../domain/sdr-work-item';
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
}

/** Closes the operational recovery loop without allowing cross-owner actions. */
export class RevenueRecoveryService {
  constructor(
    private readonly queue: SdrQueueService,
    private readonly dispositionService: SdrDispositionService,
    private readonly revenueRecordingService: RevenueRecordingService,
  ) {}

  async recover(input: RevenueRecoveryInput): Promise<RevenueRecoveryResult> {
    if (!input.organizationId) throw new Error('organizationId is required');
    if (!input.ownerId) throw new Error('ownerId is required');

    const revenueAmount = Math.max(0, Math.round(input.outcomeRevenue ?? 0));
    if (input.disposition === 'won') {
      if (revenueAmount <= 0) throw new Error('won recovery requires outcomeRevenue');
      if (!input.currency) throw new Error('won recovery requires currency');
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
    if (input.disposition === 'won') {
      const recording = await this.revenueRecordingService.record({
        id: `rev_${current.id}_won`, organizationId: input.organizationId, leadId: current.leadId,
        attributionType: 'recovered', amount: revenueAmount, currency: input.currency!, ownerId: input.ownerId,
        recordedAt: input.now, evidence: 'won-outcome', idempotencyKey: `recovery:${current.id}:won`,
      });
      revenueRecorded = true;
      duplicateRevenue = recording.duplicate;
    }

    const completed = await this.queue.complete(input.organizationId, current.id, input.disposition, {
      ownerId: input.ownerId, outcomeRevenue: revenueAmount || undefined,
    });
    return { workItem: completed, disposition: input.disposition, lifecycleState: lifecycle.state,
      transitioned: lifecycle.transitioned, revenueRecorded, revenueAmount, duplicateRevenue };
  }
}
