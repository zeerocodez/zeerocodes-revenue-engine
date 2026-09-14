import { describe, expect, it } from 'vitest';
import { createLead } from '../../src/domain/lead';
import { createOpportunity, updateOpportunityStatus } from '../../src/domain/opportunity';
import { buildRevenueFunnel, calculateRevenueRecovered, conversionRate } from '../../src/domain/revenue';

const now = '2026-09-14T10:00:00.000Z';

describe('canonical revenue model', () => {
  it('creates a tenant-owned lead with commercial and engagement context', () => {
    const lead = createLead({
      organizationId: 'client-1',
      name: 'Ada',
      source: 'whatsapp',
      campaignId: 'campaign-1',
      commercial: { estimatedDealValue: 250000, currency: 'NGN', serviceType: 'consulting' },
      consent: true,
    }, now);

    expect(lead.organizationId).toBe('client-1');
    expect(lead.state).toBe('new');
    expect(lead.commercial?.estimatedDealValue).toBe(250000);
    expect(lead.engagement?.inboundMessages).toBe(0);
  });

  it('calculates opportunity expected value from commercial value and probability', () => {
    const opportunity = createOpportunity({
      id: 'opp-1', organizationId: 'client-1', leadId: 'lead-1',
      temperature: 'hot', estimatedDealValue: 500000, currency: 'NGN', probability: 0.6, now,
    });

    expect(opportunity.expectedValue).toBe(300000);
    expect(updateOpportunityStatus(opportunity, 'won', now).wonAt).toBe(now);
  });

  it('calculates funnel rates and incremental revenue conservatively', () => {
    const funnel = buildRevenueFunnel({ leads: 100, contacted: 90, engaged: 70, qualified: 40, booked: 20, won: 8, revenue: 4000000 });
    expect(funnel.won).toBe(8);
    expect(conversionRate(funnel.won, funnel.leads)).toBe(8);
    expect(calculateRevenueRecovered(5, 8, 500000)).toBe(1500000);
    expect(calculateRevenueRecovered(8, 5, 500000)).toBe(0);
  });
});
