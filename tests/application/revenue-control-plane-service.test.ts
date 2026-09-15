import { describe, expect, it } from 'vitest';
import { RevenueControlPlaneService } from '../../src/application/revenue-control-plane-service';
import type { RevenueIntelligenceResult } from '../../src/application/revenue-intelligence-service';
import type { SdrWorkItem } from '../../src/domain/sdr-work-item';

const intelligence: RevenueIntelligenceResult = {
  funnel: { leads: 1, contacted: 1, engaged: 1, qualified: 1, booked: 1, won: 1, revenue: 500000, currency: 'NGN' },
  contactRate: 100, qualificationRate: 100, bookingRate: 100, closeRate: 100,
  revenuePerLead: 500000, revenueRecovered: 500000, attributedRevenue: 500000,
};

const item: SdrWorkItem = {
  id: 'item-1', organizationId: 'org-2', leadId: 'lead-1', leadName: 'Ada',
  priorityScore: 50, priorityBand: 'medium', action: 'follow-up', whyNow: 'Follow up',
  leadState: 'engaged', recommendedAction: 'Follow up', deadlineAt: '2026-09-15T09:00:00.000Z',
  slaMinutes: 60, slaBreached: false,
  script: { opening: 'Hi', objective: 'Qualify', qualificationQuestions: [], objectionResponses: [], closing: 'Next step?' },
  dispositionOptions: ['connected'], createdAt: '2026-09-15T08:00:00.000Z', status: 'open',
};

describe('RevenueControlPlaneService', () => {
  it('rejects cross-tenant work items', () => {
    expect(() => new RevenueControlPlaneService().calculate({
      organizationId: 'org-1', intelligence, workItems: [item], performance: [],
    })).toThrow('Tenant access denied');
  });
});
