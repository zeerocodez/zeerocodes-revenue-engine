import type { QualificationProfile, QualificationResult } from './qualification';
import { qualifyLead } from './qualification';
import type { ClientScoringConfig } from './client-configuration';

export interface ClientQualificationPolicy {
  qualificationThreshold: number;
  minimumBudget?: number | null;
  maximumUrgencyDays?: number | null;
  requireDecisionMaker?: boolean;
  requireServiceFit?: boolean;
  requireLocationFit?: boolean;
}

export const DEFAULT_CLIENT_POLICY: ClientQualificationPolicy = {
  qualificationThreshold: 70,
  requireDecisionMaker: false,
  requireServiceFit: true,
  requireLocationFit: false,
};

export interface PolicyEvaluation extends QualificationResult {
  hardDisqualified: boolean;
  disqualificationReason?: string;
}

export function evaluateClientPolicy(
  profile: QualificationProfile,
  policy: ClientQualificationPolicy = DEFAULT_CLIENT_POLICY,
  scoringConfig?: ClientScoringConfig,
): PolicyEvaluation {
  if (policy.requireServiceFit && profile.serviceFit === false) {
    return { score: 0, qualified: false, reasons: [], hardDisqualified: true, disqualificationReason: 'service fit failed' };
  }

  if (policy.requireDecisionMaker && profile.decisionMaker !== true) {
    return { score: 0, qualified: false, reasons: [], hardDisqualified: true, disqualificationReason: 'decision maker required' };
  }

  if (policy.requireLocationFit && profile.locationFit !== true) {
    return { score: 0, qualified: false, reasons: [], hardDisqualified: true, disqualificationReason: 'location fit failed' };
  }

  if (policy.minimumBudget != null && (profile.budget == null || profile.budget < policy.minimumBudget)) {
    return { score: 0, qualified: false, reasons: [], hardDisqualified: true, disqualificationReason: 'minimum budget not met' };
  }

  if (policy.maximumUrgencyDays != null && profile.urgencyDays != null && profile.urgencyDays > policy.maximumUrgencyDays) {
    return { score: 0, qualified: false, reasons: [], hardDisqualified: true, disqualificationReason: 'urgency window outside policy' };
  }

  const baseline = qualifyLead(profile, scoringConfig ? {
    threshold: scoringConfig.threshold,
    maxUrgencyDays: policy.maximumUrgencyDays ?? 30,
    requireDecisionMaker: false,
    requireBudget: false,
    weights: scoringConfig.weights,
  } : undefined);

  return {
    ...baseline,
    qualified: baseline.score >= policy.qualificationThreshold,
    hardDisqualified: false,
  };
}
