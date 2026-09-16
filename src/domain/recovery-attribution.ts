import type { RevenueLeakageType } from './revenue-leakage';

export type RecoverySource = 'sdr' | 'closer' | 'ai' | 'other';

export interface RecoveryAttribution {
  id: string;
  organizationId: string;
  leadId: string;
  leakageOpportunityId: string;
  leakageType: RevenueLeakageType;
  ownerId: string;
  recoveredAmount: number;
  currency: string;
  leakageValue: number;
  recoveryRate: number;
  recoveredAt: string;
  recoverySource: RecoverySource;
  evidence: 'won-outcome';
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateRecoveryAttributionInput {
  id: string;
  organizationId: string;
  leadId: string;
  leakageOpportunityId: string;
  leakageType: RevenueLeakageType;
  ownerId: string;
  recoveredAmount: number;
  currency?: string;
  leakageValue?: number;
  recoverySource?: RecoverySource;
  recoveredAt?: string;
  evidence?: 'won-outcome';
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Calculates recovery rate capped strictly at 100.0%.
 * Prevents division by zero or exceeding 100% against identified leakage.
 */
export function calculateRecoveryRate(recoveredAmount: number, leakageValue: number): number {
  if (recoveredAmount <= 0) return 0;
  const denominator = leakageValue > 0 ? leakageValue : recoveredAmount;
  const rawRate = (recoveredAmount / denominator) * 100;
  const rounded = Math.round(rawRate * 100) / 100;
  return Math.min(100, Math.max(0, rounded));
}

/**
 * Creates an immutable Recovery Attribution record.
 * Answers: "What revenue did Zeerocodes recover that would otherwise have remained at risk?"
 */
export function createRecoveryAttribution(input: CreateRecoveryAttributionInput): RecoveryAttribution {
  if (!input.organizationId?.trim()) throw new Error('organizationId is required');
  if (!input.leadId?.trim()) throw new Error('leadId is required');
  if (!input.leakageOpportunityId?.trim()) throw new Error('leakageOpportunityId is required');
  if (!input.ownerId?.trim()) throw new Error('ownerId is required');
  if (!Number.isFinite(input.recoveredAmount) || input.recoveredAmount <= 0) {
    throw new Error('recoveredAmount must be greater than zero');
  }

  const leakageValue = input.leakageValue && input.leakageValue > 0 ? Math.round(input.leakageValue) : Math.round(input.recoveredAmount);
  const recoveryRate = calculateRecoveryRate(input.recoveredAmount, leakageValue);
  const recoveredAt = input.recoveredAt ?? new Date().toISOString();
  const evidence = input.evidence ?? 'won-outcome';

  if (evidence !== 'won-outcome') {
    throw new Error('Recovery attribution requires won-outcome evidence');
  }

  return {
    id: input.id,
    organizationId: input.organizationId,
    leadId: input.leadId,
    leakageOpportunityId: input.leakageOpportunityId,
    leakageType: input.leakageType,
    ownerId: input.ownerId,
    recoveredAmount: Math.round(input.recoveredAmount),
    currency: input.currency || 'NGN',
    leakageValue,
    recoveryRate,
    recoveredAt,
    recoverySource: input.recoverySource || 'sdr',
    evidence,
    idempotencyKey: input.idempotencyKey,
    metadata: input.metadata,
  };
}
