import type { RevenueIntelligenceResult } from '../application/revenue-intelligence-service';

export interface WeeklyRevenueReport {
  periodStart: string;
  periodEnd: string;
  currency: string;
  revenue: number;
  revenueRecovered: number;
  revenuePerLead: number;
  closeRate: number;
  highlights: string[];
  risks: string[];
}

/** Produces a concise client-facing weekly revenue summary from measured data. */
export function buildWeeklyRevenueReport(
  periodStart: string,
  periodEnd: string,
  result: RevenueIntelligenceResult,
): WeeklyRevenueReport {
  const highlights: string[] = [];
  const risks: string[] = [];

  if (result.revenueRecovered > 0) highlights.push(`Recovered ${result.revenueRecovered.toLocaleString()} in incremental revenue.`);
  if (result.closeRate >= 20) highlights.push(`Closed ${result.closeRate}% of booked opportunities.`);
  if (result.contactRate >= 80) highlights.push(`Reached ${result.contactRate}% of captured leads.`);
  if (result.contactRate < 70) risks.push('Contact rate is below the 70% operating target.');
  if (result.closeRate < 10 && result.funnel.booked > 0) risks.push('Booked opportunities are converting below 10%.');
  if (result.funnel.qualified > 0 && result.funnel.booked === 0) risks.push('Qualified leads are not reaching booked appointments.');

  return {
    periodStart,
    periodEnd,
    currency: result.funnel.currency,
    revenue: result.funnel.revenue,
    revenueRecovered: result.revenueRecovered,
    revenuePerLead: result.revenuePerLead,
    closeRate: result.closeRate,
    highlights,
    risks,
  };
}
