export interface RevenueRecoveryAttribution {
  id: string;
  organizationId: string;
  leadId: string;
  leakageOpportunityId: string;
  leakageType: string;
  ownerId?: string;
  recoveredAmount: number;
  currency: string;
  leakageValue: number;
  recoveryRate: number;
  recoveredAt: string;
  recoverySource: 'sdr' | 'closer' | 'ai' | 'other';
  evidence: 'won-outcome';
}

export interface RevenueRecoveryAttributionInput extends Omit<RevenueRecoveryAttribution, 'recoveryRate'> {}

export function createRevenueRecoveryAttribution(input: RevenueRecoveryAttributionInput): RevenueRecoveryAttribution {
  if (!input.organizationId) throw new Error('organizationId is required');
  if (!input.leadId) throw new Error('leadId is required');
  if (!input.leakageOpportunityId) throw new Error('leakageOpportunityId is required');
  if (!Number.isFinite(input.recoveredAmount) || input.recoveredAmount <= 0) throw new Error('recoveredAmount must be greater than zero');
  if (!Number.isFinite(input.leakageValue) || input.leakageValue < 0) throw new Error('leakageValue must not be negative');
  if (!input.currency) throw new Error('currency is required');

  const recoveryRate = input.leakageValue > 0
    ? Math.min(100, Math.round((input.recoveredAmount / input.leakageValue) * 10000) / 100)
    : 0;

  return {
    ...input,
    recoveredAmount: Math.round(input.recoveredAmount),
    leakageValue: Math.round(input.leakageValue),
    recoveryRate,
    evidence: 'won-outcome',
  };
}
