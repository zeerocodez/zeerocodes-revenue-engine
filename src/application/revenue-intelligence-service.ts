import type { LeadState } from '../domain/lead-state';
import type { RevenueAttributionEvent } from '../domain/revenue-attribution';
import { buildRevenueFunnel, conversionRate, type RevenueFunnel } from '../domain/revenue';

export interface RevenueIntelligenceInput {
  leads: number;
  contacted: number;
  engaged: number;
  qualified: number;
  booked: number;
  won: number;
  revenue: number;
  currency?: string;
  baselineWon?: number;
  averageDealValue?: number;
  attributionEvents?: RevenueAttributionEvent[];
}

export interface RevenueIntelligenceResult {
  funnel: RevenueFunnel;
  contactRate: number;
  qualificationRate: number;
  bookingRate: number;
  closeRate: number;
  revenuePerLead: number;
  revenueRecovered: number;
  attributedRevenue: number;
}

/** Read-only aggregation boundary for client revenue reporting. */
export class RevenueIntelligenceService {
  calculate(input: RevenueIntelligenceInput): RevenueIntelligenceResult {
    const funnel = buildRevenueFunnel(input);
    const averageDealValue = Math.max(0, input.averageDealValue ?? (funnel.won > 0 ? funnel.revenue / funnel.won : 0));
    const attributedRevenue = (input.attributionEvents ?? []).reduce(
      (total, event) => total + (event.status === undefined || event.evidence ? event.amount : 0),
      0,
    );

    return {
      funnel,
      contactRate: conversionRate(funnel.contacted, funnel.leads),
      qualificationRate: conversionRate(funnel.qualified, funnel.leads),
      bookingRate: conversionRate(funnel.booked, funnel.qualified),
      closeRate: conversionRate(funnel.won, funnel.booked),
      revenuePerLead: funnel.leads > 0 ? Math.round(funnel.revenue / funnel.leads) : 0,
      revenueRecovered: input.baselineWon === undefined
        ? 0
        : Math.round(Math.max(0, funnel.won - input.baselineWon) * averageDealValue),
      attributedRevenue: Math.round(attributedRevenue),
    };
  }
}

export interface LeadRevenueSnapshot {
  state: LeadState;
  revenue: number;
  currency: string;
}
