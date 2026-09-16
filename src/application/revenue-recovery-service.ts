import { randomUUID } from 'node:crypto';
import type { QualificationResult } from '../domain/qualification';
import type { SdrDisposition, SdrWorkItem } from '../domain/sdr-work-item';
import { createRecoveryAttribution, type RecoveryAttribution } from '../domain/recovery-attribution';
import type { LeadRecord } from '../domain/lead';
import type { LeadOutcomeRecord } from '../domain/revenue-workflow';
import type { LeadStore } from './revenue-engine-service';
import type { LeadLifecycleService } from './lead-lifecycle-service';
import type { PostgresRevenueWorkflowRepository } from '../integrations/postgres-workflow';
import type { MemoryRevenueWorkflowRepository } from '../integrations/memory-workflow';
import type { LeadEventStore } from '../domain/lead-events';
import type { PostgresDatabase } from '../integrations/postgres';
import { RevenueRecordingService } from './revenue-recording-service';
import { SdrDispositionService } from './sdr-disposition-service';
import { SdrQueueService } from './sdr-queue-service';

export type RevenueWorkflowRepo = PostgresRevenueWorkflowRepository | MemoryRevenueWorkflowRepository;

export interface ExecuteRecoveryInput {
  organizationId: string;
  workItemId: string;
  recoveredAmount: number;
  currency?: string;
  ownerUserId: string;
  idempotencyKey?: string;
  notes?: string;
  now?: string;
}

export interface RecoveryExecutionResult {
  success: boolean;
  lead: LeadRecord;
  workItem: SdrWorkItem;
  outcome: LeadOutcomeRecord;
  recoveryAttribution: RecoveryAttribution;
  idempotentReplay?: boolean;
}

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

/**
 * Production revenue recovery service.
 * Supports end-to-end evidence-gated recovery with atomic claims, idempotent writes,
 * and recovery attributions traceable to revenue leakage.
 */
export class RevenueRecoveryService {
  private readonly workflow?: RevenueWorkflowRepo;
  private readonly leadStore?: LeadStore;
  private readonly lifecycleService?: LeadLifecycleService;
  private readonly eventStore?: LeadEventStore;
  private readonly db?: PostgresDatabase;

  private readonly queue?: SdrQueueService;
  private readonly dispositionService?: SdrDispositionService;
  private readonly revenueRecordingService?: RevenueRecordingService;

  constructor(
    first: RevenueWorkflowRepo | SdrQueueService,
    second: LeadStore | SdrDispositionService,
    third: LeadLifecycleService | RevenueRecordingService,
    eventStore?: LeadEventStore,
    db?: PostgresDatabase,
  ) {
    if ('queue' in first || typeof (first as any).enqueue === 'function') {
      this.queue = first as SdrQueueService;
      this.dispositionService = second as SdrDispositionService;
      this.revenueRecordingService = third as RevenueRecordingService;
    } else {
      this.workflow = first as RevenueWorkflowRepo;
      this.leadStore = second as LeadStore;
      this.lifecycleService = third as LeadLifecycleService;
      this.eventStore = eventStore;
      this.db = db;
    }
  }

  /**
   * Comprehensive end-to-end recovery execution:
   * Validates session owner -> Atomically claims work item -> Verifies 'booked' state ->
   * Creates Server-derived Recovery Attribution -> Transitions lifecycle to 'won' ->
   * Records financial outcome & attribution -> Completes work item -> Emits audit event.
   */
  async executeRecovery(input: ExecuteRecoveryInput): Promise<RecoveryExecutionResult> {
    if (!this.workflow || !this.leadStore || !this.lifecycleService) {
      throw new Error('RevenueRecoveryService not configured for direct workflow repository execution');
    }

    if (!input.organizationId?.trim()) throw new Error('organizationId is required');
    if (!input.workItemId?.trim()) throw new Error('workItemId is required');
    if (!input.ownerUserId?.trim()) throw new Error('ownerUserId is required');
    if (!Number.isFinite(input.recoveredAmount) || input.recoveredAmount <= 0) {
      throw new Error('recoveredAmount must be a positive number');
    }

    const now = input.now ?? new Date().toISOString();
    const currency = input.currency || 'NGN';
    const deterministicIdempotencyKey = input.idempotencyKey?.trim() || `recovery:${input.workItemId}:won`;

    // 1. Check idempotency for existing recovery attribution
    const existingRecovery = await this.workflow.findRecoveryAttributionByIdempotency(
      input.organizationId,
      deterministicIdempotencyKey,
    );

    if (existingRecovery) {
      const lead = await this.leadStore.get(existingRecovery.leadId);
      const workItem = await this.workflow.getSdrWorkItem(input.organizationId, input.workItemId);
      const outcome = await this.workflow.findOutcomeByIdempotency(
        input.organizationId,
        `outcome:${deterministicIdempotencyKey}`,
      );

      if (lead && workItem && outcome) {
        return {
          success: true,
          lead,
          workItem,
          outcome,
          recoveryAttribution: existingRecovery,
          idempotentReplay: true,
        };
      }
    }

    // 2. Resolve trusted work item from server store
    const workItem = await this.workflow.getSdrWorkItem(input.organizationId, input.workItemId);
    if (!workItem) throw new Error(`SDR work item not found: ${input.workItemId}`);
    if (workItem.organizationId !== input.organizationId) throw new Error('Tenant access denied');

    if (workItem.status === 'completed') {
      throw new Error('SDR work item is already completed');
    }
    if (workItem.status === 'cancelled') {
      throw new Error('SDR work item is cancelled');
    }

    // 3. Atomically claim if open
    let claimedItem: SdrWorkItem | null = workItem;
    if (workItem.status === 'open') {
      claimedItem = await this.workflow.claimSdrWorkItemAtomic(
        input.organizationId,
        workItem.id,
        input.ownerUserId,
        now,
      );
      if (!claimedItem) {
        throw new Error('Failed to claim SDR work item. It may have been claimed by another agent.');
      }
    } else if (workItem.ownerId && workItem.ownerId !== input.ownerUserId) {
      // If claimed by another user, verify owner match
      throw new Error(`SDR work item is claimed by another user (${workItem.ownerId})`);
    }

    // 4. Resolve lead & verify state
    const lead = await this.leadStore.get(claimedItem.leadId);
    if (!lead) throw new Error(`Lead not found: ${claimedItem.leadId}`);
    if (lead.organizationId !== input.organizationId) throw new Error('Tenant access denied');

    if (lead.state !== 'booked') {
      throw new Error(`Revenue recovery requires lead to be in 'booked' state, current state is '${lead.state}'`);
    }

    // 5. Server-derived leakage value
    const leakageOpportunityId = claimedItem.leakageOpportunityId || `leak_${lead.id}_recovery`;
    const leakageType = claimedItem.leakageType || 'qualified-no-booking';
    const leakageValue = claimedItem.estimatedRecoverableRevenue && claimedItem.estimatedRecoverableRevenue > 0
      ? claimedItem.estimatedRecoverableRevenue
      : input.recoveredAmount;

    // 6. Build records
    const outcomeId = randomUUID();
    const outcomeRecord: LeadOutcomeRecord = {
      id: outcomeId,
      organizationId: input.organizationId,
      leadId: lead.id,
      outcome: 'won',
      revenueAmount: input.recoveredAmount,
      currency,
      reason: input.notes || `Recovered via SDR work item ${claimedItem.id}`,
      ownerUserId: input.ownerUserId,
      idempotencyKey: `outcome:${deterministicIdempotencyKey}`,
      occurredAt: now,
      metadata: { workItemId: claimedItem.id, recovery: true },
    };

    const recoveryAttribution = createRecoveryAttribution({
      id: randomUUID(),
      organizationId: input.organizationId,
      leadId: lead.id,
      leakageOpportunityId,
      leakageType,
      ownerId: input.ownerUserId,
      recoveredAmount: input.recoveredAmount,
      currency,
      leakageValue,
      recoverySource: 'sdr',
      recoveredAt: now,
      evidence: 'won-outcome',
      idempotencyKey: deterministicIdempotencyKey,
      metadata: { workItemId: claimedItem.id, outcomeId },
    });

    // 7. Apply lifecycle transition (booked -> won)
    const lifecycleResult = await this.lifecycleService.transition({
      leadId: lead.id,
      organizationId: input.organizationId,
      from: 'booked',
      to: 'won',
      consent: true,
      outcome: 'won',
      now,
    });

    // 8. Persist financial outcome and attributions
    await this.workflow.saveOutcome(outcomeRecord);
    await this.workflow.saveAttribution({
      id: randomUUID(),
      organizationId: input.organizationId,
      leadId: lead.id,
      outcomeId: outcomeRecord.id,
      source: lead.source,
      campaign: String(lead.metadata?.campaign || ''),
      medium: String(lead.metadata?.medium || ''),
      attributionModel: 'first_touch',
      attributedAmount: input.recoveredAmount,
      currency,
      createdAt: now,
    });

    await this.workflow.saveRecoveryAttribution(recoveryAttribution);

    // 9. Complete SDR work item
    const completedWorkItem = await this.workflow.completeSdrWorkItem(
      input.organizationId,
      claimedItem.id,
      'won',
      input.recoveredAmount,
      input.ownerUserId,
      now,
    );

    // 10. Update leakage opportunity status if present
    if (claimedItem.leakageOpportunityId) {
      await this.workflow.updateLeakageStatus(
        input.organizationId,
        claimedItem.leakageOpportunityId,
        'recovered',
      );
    }

    // 11. Append audit lead event
    if (this.eventStore) {
      await this.eventStore.append({
        id: randomUUID(),
        leadId: lead.id,
        organizationId: input.organizationId,
        type: 'lead.won',
        actor: 'sdr',
        timestamp: now,
        fromState: 'booked',
        toState: 'won',
        reason: `Revenue recovered: ₦${input.recoveredAmount.toLocaleString()}`,
        metadata: {
          workItemId: claimedItem.id,
          outcomeId,
          recoveredAmount: input.recoveredAmount,
          recoveryRate: recoveryAttribution.recoveryRate,
        },
      });
    }

    return {
      success: true,
      lead: lifecycleResult.lead,
      workItem: completedWorkItem || claimedItem,
      outcome: outcomeRecord,
      recoveryAttribution,
    };
  }

  /**
   * Closes the operational loop: claim -> disposition -> lifecycle outcome ->
   * revenue attribution -> work-item completion.
   */
  async recover(input: RevenueRecoveryInput): Promise<RevenueRecoveryResult> {
    if (!this.queue || !this.dispositionService || !this.revenueRecordingService) {
      throw new Error('RevenueRecoveryService not configured for queue disposition workflow');
    }

    if (!input.organizationId) throw new Error('organizationId is required');
    if (!input.ownerId) throw new Error('ownerId is required');

    const revenueAmount = Math.max(0, Math.round(input.outcomeRevenue ?? 0));
    if (input.disposition === 'won') {
      if (revenueAmount <= 0) throw new Error('won recovery requires outcomeRevenue');
      if (!input.currency) throw new Error('won recovery requires currency');
    }

    const queue = await this.queue.queue(input.organizationId, input.now);
    const item = queue.items.find((candidate) => candidate.id === input.workItemId);
    if (!item) throw new Error('SDR work item not found or already completed');
    if (item.organizationId !== input.organizationId) throw new Error('Tenant access denied');
    if (item.status === 'open') await this.queue.claim(input.organizationId, item.id, input.ownerId);

    const current = (await this.queue.queue(input.organizationId, input.now)).items.find(
      (candidate) => candidate.id === input.workItemId,
    );
    if (!current) throw new Error('SDR work item disappeared during recovery');

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
        id: `rev_${current.id}_won`,
        organizationId: input.organizationId,
        leadId: current.leadId,
        attributionType: 'recovered',
        amount: revenueAmount,
        currency: input.currency!,
        ownerId: input.ownerId,
        recordedAt: input.now,
        evidence: 'won-outcome',
        idempotencyKey: `recovery:${current.id}:won`,
      });
      revenueRecorded = true;
      duplicateRevenue = recording.duplicate;
    }

    const completed = await this.queue.complete(
      input.organizationId,
      current.id,
      input.disposition,
      { ownerId: input.ownerId, outcomeRevenue: revenueAmount || undefined },
    );

    return {
      workItem: completed,
      disposition: input.disposition,
      lifecycleState: lifecycle.state,
      transitioned: lifecycle.transitioned,
      revenueRecorded,
      revenueAmount,
      duplicateRevenue,
    };
  }
}
