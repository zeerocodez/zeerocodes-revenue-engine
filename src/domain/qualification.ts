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
}

/**
 * Deterministic baseline. Client-specific rules should be stored as configuration,
 * not hard-coded in the UI or AI prompt.
 */
export function qualifyLead(profile: QualificationProfile): QualificationResult {
  let score = 0;
  const reasons: string[] = [];

  if (profile.serviceFit === true) { score += 25; reasons.push('service fit'); }
  if (profile.needConfirmed === true) { score += 20; reasons.push('need confirmed'); }
  if (profile.decisionMaker === true) { score += 20; reasons.push('decision maker'); }
  if (profile.locationFit === true) { score += 15; reasons.push('location fit'); }
  if (typeof profile.urgencyDays === 'number' && profile.urgencyDays <= 14) {
    score += 10;
    reasons.push('near-term urgency');
  }
  if (typeof profile.budget === 'number' && profile.budget > 0) {
    score += 10;
    reasons.push('budget identified');
  }

  return { score, qualified: score >= 70, reasons };
}
