import { describe, expect, it } from 'vitest';
import { calculateSdrQaTotal, createSdrQaReview } from '../../src/domain/sdr-qa';

describe('SDR QA', () => {
  it('weights process quality into a single score', () => {
    expect(calculateSdrQaTotal({
      responseQuality: 100, qualificationCompleteness: 90, dispositionAccuracy: 80,
      slaAdherence: 70, escalationQuality: 100, outcomeQuality: 80,
    })).toBe(86);
  });

  it('passes reviews at 80 or above', () => {
    const review = createSdrQaReview({
      id: 'qa_1', organizationId: 'org_1', leadId: 'lead_1', workItemId: 'work_1',
      scores: { responseQuality: 80, qualificationCompleteness: 80, dispositionAccuracy: 80, slaAdherence: 80, escalationQuality: 80, outcomeQuality: 80 },
      reviewedAt: '2026-09-15T08:00:00.000Z',
    });
    expect(review.total).toBe(80);
    expect(review.passed).toBe(true);
  });
});
