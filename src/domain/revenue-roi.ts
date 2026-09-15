export interface RevenueRecoveryRoiInput {
  estimatedRecoverableRevenue: number;
  recoveredRevenue: number;
  totalOpportunityValue?: number;
  identifiedLeakageValue?: number;
  currency: string;
}

export interface RevenueRecoveryRoiResult {
  currency: string;
  estimatedRecoverableRevenue: number;
  recoveredRevenue: number;
  recoveryRate: number;
  identifiedLeakageValue: number;
  leakageRate: number;
  unrecoveredRevenue: number;
}

function nonNegative(value: number | undefined): number {
  return Math.max(0, Number.isFinite(value ?? NaN) ? value ?? 0 : 0);
}

function percentage(numerator: number, denominator: number): number {
  return denominator <= 0 ? 0 : Math.round((numerator / denominator) * 10000) / 100;
}

/** Executive ROI view: how much identified leakage was actually recovered. */
export function calculateRevenueRecoveryRoi(input: RevenueRecoveryRoiInput): RevenueRecoveryRoiResult {
  if (!input.currency.trim()) throw new Error('currency is required');

  const estimatedRecoverableRevenue = nonNegative(input.estimatedRecoverableRevenue);
  const recoveredRevenue = Math.min(estimatedRecoverableRevenue, nonNegative(input.recoveredRevenue));
  const identifiedLeakageValue = nonNegative(input.identifiedLeakageValue ?? estimatedRecoverableRevenue);
  const totalOpportunityValue = nonNegative(input.totalOpportunityValue);

  return {
    currency: input.currency,
    estimatedRecoverableRevenue: Math.round(estimatedRecoverableRevenue),
    recoveredRevenue: Math.round(recoveredRevenue),
    recoveryRate: percentage(recoveredRevenue, estimatedRecoverableRevenue),
    identifiedLeakageValue: Math.round(identifiedLeakageValue),
    leakageRate: percentage(identifiedLeakageValue, totalOpportunityValue),
    unrecoveredRevenue: Math.round(Math.max(0, estimatedRecoverableRevenue - recoveredRevenue)),
  };
}
