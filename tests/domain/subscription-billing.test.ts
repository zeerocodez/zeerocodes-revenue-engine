import { describe, expect, it } from 'vitest';
import {
  SUBSCRIPTION_PLANS,
  calculateUsagePercentage,
} from '../../src/domain/subscription-billing';

describe('Subscription Billing & Metered Usage Engine', () => {
  it('defines 3 distinct enterprise tiers with feature gating', () => {
    expect(SUBSCRIPTION_PLANS.starter.maxMonthlyLeads).toBe(300);
    expect(SUBSCRIPTION_PLANS.starter.includesVoiceAgent).toBe(false);

    expect(SUBSCRIPTION_PLANS.growth.maxMonthlyLeads).toBe(1500);
    expect(SUBSCRIPTION_PLANS.growth.includesVoiceAgent).toBe(true);

    expect(SUBSCRIPTION_PLANS.enterprise.maxMonthlyLeads).toBe(10000);
  });

  it('calculates accurate usage percentage capped at 100%', () => {
    expect(calculateUsagePercentage(150, 300)).toBe(50);
    expect(calculateUsagePercentage(450, 1500)).toBe(30);
    expect(calculateUsagePercentage(2000, 1500)).toBe(100);
    expect(calculateUsagePercentage(0, 1000)).toBe(0);
  });
});
