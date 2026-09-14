import { describe, expect, it } from 'vitest';
import { calculateRevenuePriority } from '../../src/domain/revenue-priority';

describe('revenue priority', () => {
  it('prioritises urgent purchase intent', () => {
    const result = calculateRevenuePriority({
      score: 80,
      intent: 'purchase',
      urgencyDays: 1,
      estimatedDealValue: 2500000,
      temperature: 'hot',
    });

    expect(result.score).toBe(100);
    expect(result.band).toBe('critical');
    expect(result.reason).toContain('strong buying or human intent');
  });

  it('does not create priority from deal value alone', () => {
    const result = calculateRevenuePriority({
      score: 20,
      intent: 'information',
      estimatedDealValue: 10000000,
    });

    expect(result.band).toBe('low');
  });

  it('makes stop intent zero priority', () => {
    const result = calculateRevenuePriority({
      score: 90,
      intent: 'stop',
      estimatedDealValue: 5000000,
    });

    expect(result.score).toBe(0);
  });
});
