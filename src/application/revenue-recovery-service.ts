import { randomUUID } from 'node:crypto';
import type { LeadStore } from './revenue-engine-service';
import type { LeadLifecycleService } from './lead-lifecycle-service';
import type { PostgresRevenueWorkflowRepository } from '../integrations/postgres-workflow';
import type { MemoryRevenueWorkflowRepository } from '../integrations/memory-workflow';
import type { LeadEventStore } from '../domain/lead-events';
import type { PostgresDatabase } from '../integrations/postgres';
import { createRecoveryAttribution, type RecoveryAttribution } from '../domain/recovery-attribution';
import type { SdrWorkItem } from '../domain/sdr-work-item';
import type { LeadRecord } from '../domain/lead';
import type { LeadOutcomeRecord } from '../domain/revenue-workflow';

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

export class RevenueRecoveryService {
  constructor(
    private readonly workflow: RevenueWorkflowRepo,
    private readonly leadStore: LeadStore,
    private readonly lifecycleService: LeadLifecycleService,
    private readonly eventStore?: LeadEventStore,
    private readonly db?: PostgresDatabase,
  ) {}

  async executeRecovery(input: ExecuteRecoveryInput): Promise<RecoveryExecutionResult> {
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
}
