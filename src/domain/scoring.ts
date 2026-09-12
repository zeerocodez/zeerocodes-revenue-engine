import type { QualificationProfile, QualificationResult } from './qualification';
import { qualifyLead } from './qualification';
import type { ClientScoringConfig } from './client-configuration';

export interface LeadScore extends QualificationResult {
  band: 'cold' | 'warm' | 'hot';
}

/** Score a lead using the tenant's configured weights and thresholds. */
export function scoreLead(
  profile: QualificationProfile,
  config?: ClientScoringConfig,
): LeadScore {
  const result = qualifyLead(profile, config ? {
    threshold: config.threshold,
    maxUrgencyDays: 30,
    requireDecisionMaker: false,
    requireBudget: false,
    weights: config.weights,
  } : undefined);

  const hotScore = config?.hotScore ?? 80;
  const warmScore = config?.warmScore ?? 50;
  const band = result.score >= hotScore ? 'hot' : result.score >= warmScore ? 'warm' : 'cold';
  return { ...result, band };
}
