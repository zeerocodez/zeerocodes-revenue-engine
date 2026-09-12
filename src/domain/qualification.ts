import { DEFAULT_QUALIFICATION_CONFIG, type QualificationConfig } from './qualification-config';

export type QualificationAnswer = string | number | boolean | null;

export interface QualificationProfile {
  budget?: number | null;
  urgencyDays?: number | null;
  serviceFit?: boolean | null;
  decisionMaker?: boolean | null;
  locationFit?: boolean | null;
  needConfirmed?: boolean | null;
}

export interface QualificationResult {
  score: number;
  qualified: boolean;
  reasons: string[];
  hardDisqualified: boolean;
}

/** Deterministic qualification. Client policy is supplied as configuration. */
export function qualifyLead(profile: QualificationProfile, config: QualificationConfig = DEFAULT_QUALIFICATION_CONFIG): QualificationResult {
  const reasons: string[] = [];
  let score = 0;

  if (config.requireDecisionMaker && profile.decisionMaker !== true) {
    return { score: 0, qualified: false, reasons: ['decision maker required'], hardDisqualified: true };
  }
  if (config.requireBudget && !(typeof profile.budget === 'number' && profile.budget > 0)) {
    return { score: 0, qualified: false, reasons: ['budget required'], hardDisqualified: true };
  }

  if (profile.serviceFit === true) { score += config.weights.serviceFit; reasons.push('service fit'); }
  if (profile.needConfirmed === true) { score += config.weights.needConfirmed; reasons.push('need confirmed'); }
  if (profile.decisionMaker === true) { score += config.weights.decisionMaker; reasons.push('decision maker'); }
  if (profile.locationFit === true) { score += config.weights.locationFit; reasons.push('location fit'); }
  if (typeof profile.urgencyDays === 'number' && profile.urgencyDays <= config.maxUrgencyDays) { score += config.weights.urgency; reasons.push('near-term urgency'); }
  if (typeof profile.budget === 'number' && profile.budget > 0) { score += config.weights.budget; reasons.push('budget identified'); }

  return { score, qualified: score >= config.threshold, reasons, hardDisqualified: false };
}
