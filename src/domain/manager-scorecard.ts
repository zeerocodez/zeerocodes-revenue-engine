import type { SdrPerformanceResult } from '../application/sdr-performance-service';
import type { SdrQaReview } from './sdr-qa';

export interface ManagerScorecard {
  teamSize: number;
  totalAssigned: number;
  totalCompleted: number;
  totalWins: number;
  totalRevenue: number;
  currency: string;
  averageSlaAdherence: number;
  averageQaScore: number;
  atRiskOwners: string[];
  escalationCount: number;
  teamCloseRate: number;
  teamScore: number;
}

export interface ManagerScorecardInput {
  performance: SdrPerformanceResult[];
  qaReviews?: SdrQaReview[];
  escalationCount?: number;
  currency?: string;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100;
}

function rate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 10000) / 100;
}

/** Aggregates SDR performance into a manager operating scorecard. */
export function buildManagerScorecard(input: ManagerScorecardInput): ManagerScorecard {
  const performance = input.performance;
  const qaReviews = input.qaReviews ?? [];
  const qaByOwner = new Map<string, number[]>();

  for (const review of qaReviews) {
    if (!review.ownerId) continue;
    const existing = qaByOwner.get(review.ownerId) ?? [];
    existing.push(review.total);
    qaByOwner.set(review.ownerId, existing);
  }

  const atRiskOwners = performance
    .filter((owner) => {
      const qaScores = qaByOwner.get(owner.ownerId) ?? [];
      const qaRisk = qaScores.length > 0 && average(qaScores) < 80;
      return owner.slaAdherenceRate < 80 || qaRisk;
    })
    .map((owner) => owner.ownerId);

  const averageSlaAdherence = average(performance.map((owner) => owner.slaAdherenceRate));
  const averageQaScore = average(qaReviews.map((review) => review.total));
  const teamCloseRate = rate(
    performance.reduce((sum, owner) => sum + owner.wins, 0),
    performance.reduce((sum, owner) => sum + owner.appointmentsBooked, 0),
  );
  const teamScore = Math.round(
    averageSlaAdherence * 0.4 +
      (averageQaScore || 0) * 0.3 +
      Math.min(100, teamCloseRate) * 0.3,
  );

  return {
    teamSize: performance.length,
    totalAssigned: performance.reduce((sum, owner) => sum + owner.assigned, 0),
    totalCompleted: performance.reduce((sum, owner) => sum + owner.completed, 0),
    totalWins: performance.reduce((sum, owner) => sum + owner.wins, 0),
    totalRevenue: Math.round(performance.reduce((sum, owner) => sum + owner.revenue, 0)),
    currency: input.currency ?? 'NGN',
    averageSlaAdherence,
    averageQaScore,
    atRiskOwners,
    escalationCount: input.escalationCount ?? 0,
    teamCloseRate,
    teamScore,
  };
}
