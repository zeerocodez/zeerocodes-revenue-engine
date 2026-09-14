export type OpportunityStatus = 'open' | 'booked' | 'won' | 'lost' | 'nurture';
export type LeadTemperature = 'hot' | 'warm' | 'cold' | 'nurture' | 'invalid';

export interface Opportunity {
  id: string;
  organizationId: string;
  leadId: string;
  status: OpportunityStatus;
  temperature: LeadTemperature;
  estimatedDealValue: number;
  currency: string;
  probability: number;
  expectedValue: number;
  serviceType?: string;
  ownerId?: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
  bookedAt?: string;
  wonAt?: string;
  lostAt?: string;
  lostReason?: string;
  metadata?: Record<string, unknown>;
}

export interface OpportunityInput {
  id: string;
  organizationId: string;
  leadId: string;
  temperature: LeadTemperature;
  estimatedDealValue?: number;
  currency?: string;
  probability?: number;
  serviceType?: string;
  ownerId?: string;
  source?: string;
  now?: string;
}

const DEFAULT_PROBABILITY: Record<LeadTemperature, number> = {
  hot: 0.6,
  warm: 0.35,
  cold: 0.1,
  nurture: 0.05,
  invalid: 0,
};

function clampProbability(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** Creates the commercial opportunity attached to a lead. Expected value is never inferred from score alone. */
export function createOpportunity(input: OpportunityInput): Opportunity {
  const estimatedDealValue = Math.max(0, input.estimatedDealValue ?? 0);
  const probability = clampProbability(input.probability ?? DEFAULT_PROBABILITY[input.temperature]);
  const now = input.now ?? new Date().toISOString();

  return {
    id: input.id,
    organizationId: input.organizationId,
    leadId: input.leadId,
    status: input.temperature === 'invalid' ? 'lost' : 'open',
    temperature: input.temperature,
    estimatedDealValue,
    currency: input.currency ?? 'NGN',
    probability,
    expectedValue: Math.round(estimatedDealValue * probability),
    serviceType: input.serviceType,
    ownerId: input.ownerId,
    source: input.source,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateOpportunityStatus(
  opportunity: Opportunity,
  status: OpportunityStatus,
  now = new Date().toISOString(),
  details: { lostReason?: string } = {},
): Opportunity {
  return {
    ...opportunity,
    status,
    updatedAt: now,
    bookedAt: status === 'booked' ? now : opportunity.bookedAt,
    wonAt: status === 'won' ? now : opportunity.wonAt,
    lostAt: status === 'lost' ? now : opportunity.lostAt,
    lostReason: details.lostReason ?? opportunity.lostReason,
  };
}
