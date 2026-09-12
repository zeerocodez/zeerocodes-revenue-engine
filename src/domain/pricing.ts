export type PricingInput = {
  monthlyLeadVolume: number;
  qualificationRate: number;
  qualifiedLeadValue: number;
  responseSlaMinutes: number;
  serviceTier: 'pilot' | 'growth' | 'scale';
};

export type PricingResult = {
  estimatedQualifiedLeads: number;
  estimatedMonthlyValue: number;
  recommendedMonthlyFee: number;
  recommendedQualifiedLeadFee: number;
};

export function calculatePricing(input: PricingInput): PricingResult {
  const qualified = Math.max(0, input.monthlyLeadVolume) * Math.max(0, Math.min(1, input.qualificationRate));
  const value = qualified * Math.max(0, input.qualifiedLeadValue);

  const multiplier = input.serviceTier === 'scale' ? 0.12 : input.serviceTier === 'growth' ? 0.09 : 0.06;
  const slaFactor = input.responseSlaMinutes <= 5 ? 1.1 : input.responseSlaMinutes <= 15 ? 1 : 0.9;
  const recommendedMonthlyFee = Math.round(value * multiplier * slaFactor);
  const recommendedQualifiedLeadFee = qualified > 0 ? Math.round(recommendedMonthlyFee / qualified) : 0;

  return {
    estimatedQualifiedLeads: Math.round(qualified),
    estimatedMonthlyValue: Math.round(value),
    recommendedMonthlyFee,
    recommendedQualifiedLeadFee,
  };
}
