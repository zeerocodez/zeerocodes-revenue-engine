export interface SdrQaScore {
  responseQuality: number;
  qualificationCompleteness: number;
  dispositionAccuracy: number;
  slaAdherence: number;
  escalationQuality: number;
  outcomeQuality: number;
}

export interface SdrQaReview {
  id: string;
  organizationId: string;
  leadId: string;
  workItemId: string;
  ownerId?: string;
  reviewerId?: string;
  scores: SdrQaScore;
  total: number;
  passed: boolean;
  notes?: string;
  reviewedAt: string;
}

function bounded(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** Weighted QA score; outcome quality is deliberately not allowed to hide poor process. */
export function calculateSdrQaTotal(scores: SdrQaScore): number {
  return Math.round(
    bounded(scores.responseQuality) * 0.2 +
    bounded(scores.qualificationCompleteness) * 0.2 +
    bounded(scores.dispositionAccuracy) * 0.15 +
    bounded(scores.slaAdherence) * 0.2 +
    bounded(scores.escalationQuality) * 0.1 +
    bounded(scores.outcomeQuality) * 0.15,
  );
}

export function createSdrQaReview(input: Omit<SdrQaReview, 'total' | 'passed'>): SdrQaReview {
  const total = calculateSdrQaTotal(input.scores);
  return { ...input, total, passed: total >= 80 };
}
