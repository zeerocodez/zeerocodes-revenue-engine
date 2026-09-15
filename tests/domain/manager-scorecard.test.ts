import { describe, expect, it } from 'vitest';
import { buildManagerScorecard } from '../../src/domain/manager-scorecard';

const performance = [
  {
    ownerId: 'sdr-1', assigned: 10, completed: 9, slaBreaches: 1, slaAdherenceRate: 90,
    qualified: 5, appointmentsBooked: 4, wins: 2, revenue: 400000,
    qualificationRate: 55.56, bookingRate: 80, closeRate: 50,
  },
  {
    ownerId: 'sdr-2', assigned: 10, completed: 8, slaBreaches: 3, slaAdherenceRate: 70,
    qualified: 3, appointmentsBooked: 2, wins: 0, revenue: 0,
    qualificationRate: 37.5, bookingRate: 66.67, closeRate: 0,
  },
];

describe('buildManagerScorecard', () => {
  it('aggregates team performance and flags at-risk owners', () => {
    const result = buildManagerScorecard({
      performance,
      currency: 'NGN',
      escalationCount: 2,
    });

    expect(result.teamSize).toBe(2);
    expect(result.totalAssigned).toBe(20);
    expect(result.totalCompleted).toBe(17);
    expect(result.totalWins).toBe(2);
    expect(result.totalRevenue).toBe(400000);
    expect(result.atRiskOwners).toEqual(['sdr-2']);
    expect(result.escalationCount).toBe(2);
    expect(result.teamCloseRate).toBe(33.33);
  });
});
