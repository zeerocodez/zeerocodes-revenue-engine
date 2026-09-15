import type { LeadState } from './lead-state';
import type { LeadIntent } from './lead';

export type RevenueLeakType =
  | 'uncontacted'
  | 'stalled-engagement'
  | 'qualified-no-booking'
  | 'booked-no-sale'
  | 'stale-lost';

export type RevenueLeakSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface RevenueLeakageInput {
  leadId: string;
  organizationId: string;
  state: LeadState;
  intent?: LeadIntent;
  createdAt: string;
  lastActivityAt?: string;
  deadlineAt?: string;
  estimatedDealValue?: number;
  now?: string;
  appointmentCompleted?: boolean;
  lostAt?: string;
}

export interface RevenueLeakageOpportunity {
  id: string;
  leadId: string;
  organizationId: string;
  type: RevenueLeakType;
  severity: RevenueLeakSeverity;
  score: number;
  estimatedRecoverableRevenue: number;
  ageHours: number;
  reason: string;
  recommendedAction: string;
}

const severityRank: Record<RevenueLeakSeverity, number> = { critical: 4, high: 3, medium: 2, low: 1 };

function hoursSince(value: string | undefined, now: string): number {
  if (!value) return 0;
  return Math.max(0, (Date.parse(now) - Date.parse(value)) / 3_600_000);
}

function opportunity(input: RevenueLeakageInput, type: RevenueLeakType, severity: RevenueLeakSeverity, score: number, reason: string, recommendedAction: string, ageHours: number): RevenueLeakageOpportunity {
  return {
    id: `${input.organizationId}_${input.leadId}_${type}`,
    leadId: input.leadId,
    organizationId: input.organizationId,
    type,
    severity,
    score: Math.min(100, Math.max(0, Math.round(score))),
    estimatedRecoverableRevenue: Math.max(0, Math.round(input.estimatedDealValue ?? 0)),
    ageHours: Math.round(ageHours * 10) / 10,
    reason,
    recommendedAction,
  };
}

/** Detects commercially meaningful revenue leakage without pretending every inactive lead is recoverable. */
export function detectRevenueLeakage(input: RevenueLeakageInput): RevenueLeakageOpportunity | null {
  const now = input.now ?? new Date().toISOString();
  const ageHours = hoursSince(input.lastActivityAt ?? input.createdAt, now);
  const value = Math.max(0, input.estimatedDealValue ?? 0);

  if (input.state === 'invalid' || input.state === 'won') return null;

  if (input.deadlineAt && Date.parse(now) > Date.parse(input.deadlineAt) && input.state !== 'lost') {
    return opportunity(input, 'uncontacted', 'critical', 95, 'The lead response deadline has been missed.', 'Recover the lead immediately and record the outcome.', ageHours);
  }

  if (input.state === 'new' && ageHours >= 1) {
    return opportunity(input, 'uncontacted', ageHours >= 24 ? 'critical' : 'high', ageHours >= 24 ? 90 : 80, `New lead has waited ${Math.round(ageHours)} hours without meaningful activity.`, 'Contact immediately and restore the response SLA.', ageHours);
  }

  if ((input.state === 'engaged' || input.state === 'contacting') && ageHours >= 24) {
    return opportunity(input, 'stalled-engagement', ageHours >= 72 ? 'high' : 'medium', ageHours >= 72 ? 78 : 65, `Engaged lead has had no activity for ${Math.round(ageHours)} hours.`, 'Re-open the conversation, address the last objection, and qualify for next step.', ageHours);
  }

  if (input.state === 'qualified') {
    const score = value >= 1_000_000 ? 88 : 76;
    return opportunity(input, 'qualified-no-booking', value >= 1_000_000 ? 'critical' : 'high', score, 'Qualified opportunity has not converted to an appointment.', 'Assign an SDR now to resolve objections and secure the appointment.', ageHours);
  }

  if (input.state === 'booked' && (input.appointmentCompleted || ageHours >= 48)) {
    return opportunity(input, 'booked-no-sale', value >= 1_000_000 ? 'high' : 'medium', value >= 1_000_000 ? 82 : 68, 'Booked opportunity has not produced a recorded sale.', 'Trigger closer follow-up and record the commercial outcome.', ageHours);
  }

  if (input.state === 'lost' && input.lostAt && ageHours >= 168) {
    return opportunity(input, 'stale-lost', value >= 500_000 ? 'medium' : 'low', value >= 500_000 ? 58 : 42, 'Previously lost opportunity is old enough for a controlled resurrection attempt.', 'Run a value-based reactivation sequence; stop if the prospect opts out.', ageHours);
  }

  return null;
}

export function rankRevenueLeakage(opportunities: RevenueLeakageOpportunity[]): RevenueLeakageOpportunity[] {
  return [...opportunities].sort((a, b) => severityRank[b.severity] - severityRank[a.severity] || b.score - a.score || b.estimatedRecoverableRevenue - a.estimatedRecoverableRevenue);
}
