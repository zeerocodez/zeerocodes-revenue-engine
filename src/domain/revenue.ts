import type { LeadTemperature } from './opportunity';

export interface RevenueAttribution {
  leadId: string;
  organizationId: string;
  source?: string;
  campaignId?: string;
  channel?: string;
}

export interface RevenueRecord {
  id: string;
  organizationId: string;
  leadId: string;
  opportunityId?: string;
  status: 'pending' | 'won' | 'lost' | 'refunded';
  amount: number;
  currency: string;
  temperature?: LeadTemperature;
  attribution: RevenueAttribution;
  recordedAt: string;
  closedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface RevenueFunnel {
  leads: number;
  contacted: number;
  engaged: number;
  qualified: number;
  booked: number;
  won: number;
  revenue: number;
  currency: string;
}

export function conversionRate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 10000) / 100;
}

/** Calculates funnel conversion without allowing invalid negative counts. */
export function buildRevenueFunnel(input: Omit<RevenueFunnel, 'currency'> & { currency?: string }): RevenueFunnel {
  const nonNegative = (value: number) => Math.max(0, Math.round(value));
  return {
    leads: nonNegative(input.leads),
    contacted: nonNegative(input.contacted),
    engaged: nonNegative(input.engaged),
    qualified: nonNegative(input.qualified),
    booked: nonNegative(input.booked),
    won: nonNegative(input.won),
    revenue: Math.max(0, Math.round(input.revenue)),
    currency: input.currency ?? 'NGN',
  };
}

export function calculateRevenueRecovered(
  baselineWon: number,
  currentWon: number,
  averageDealValue: number,
): number {
  const incrementalWins = Math.max(0, Math.round(currentWon) - Math.round(baselineWon));
  return Math.round(incrementalWins * Math.max(0, averageDealValue));
}
