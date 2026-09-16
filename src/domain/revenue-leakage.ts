import type { LeadRecord } from './lead';
import type { AppointmentRecord, LeadOutcomeRecord } from './revenue-workflow';
import { LEAD_STATE_SLA_MINUTES } from './lead-state-machine';

export type RevenueLeakageType =
  | 'uncontacted'
  | 'stalled-engagement'
  | 'qualified-no-booking'
  | 'booked-no-sale'
  | 'stale-lost';

export type LeakageSeverity = 'critical' | 'high' | 'medium' | 'low';
export type LeakageStatus = 'active' | 'recovered' | 'dismissed' | 'expired';

export interface RevenueLeakageOpportunity {
  id: string;
  organizationId: string;
  leadId: string;
  leadName: string;
  leakageType: RevenueLeakageType;
  severity: LeakageSeverity;
  reason: string;
  estimatedRecoverableRevenue: number;
  currency: string;
  recommendedAction: string;
  detectedAt: string;
  status: LeakageStatus;
  evidence: Record<string, unknown>;
}

export interface LeakageDetectionInput {
  lead: LeadRecord;
  appointments?: AppointmentRecord[];
  outcomes?: LeadOutcomeRecord[];
  now?: string;
  baselineAverageDealValue?: number;
}

const DEFAULT_DEAL_VALUE = 120_000;

export function deriveEstimatedDealValue(lead: LeadRecord, baselineValue = DEFAULT_DEAL_VALUE): number {
  if (lead.commercial?.estimatedDealValue && lead.commercial.estimatedDealValue > 0) {
    return Math.round(lead.commercial.estimatedDealValue);
  }
  if (typeof lead.profile?.budget === 'number' && lead.profile.budget > 0) {
    return Math.round(lead.profile.budget);
  }
  return baselineValue;
}

/**
 * Detects whether a lead represents a revenue leakage opportunity.
 * Financial value is server-derived based on lead commercial profile and baseline.
 */
export function detectLeadRevenueLeakage(input: LeakageDetectionInput): RevenueLeakageOpportunity | null {
  const now = input.now ?? new Date().toISOString();
  const nowMs = Date.parse(now);
  const { lead } = input;
  const leadUpdatedMs = Date.parse(lead.updatedAt || lead.createdAt);
  const elapsedMinutes = Math.max(0, Math.floor((nowMs - leadUpdatedMs) / 60_000));
  const estimatedValue = deriveEstimatedDealValue(lead, input.baselineAverageDealValue ?? DEFAULT_DEAL_VALUE);
  const currency = lead.commercial?.currency || 'NGN';
  const leadScore = lead.score ?? 0;

  // 1. Uncontacted Leakage: new lead that hasn't received outbound contact past SLA
  if (lead.state === 'new') {
    const sla = LEAD_STATE_SLA_MINUTES.new ?? 5;
    if (elapsedMinutes > sla) {
      const severity: LeakageSeverity = elapsedMinutes > sla * 4 ? 'critical' : elapsedMinutes > sla * 2 ? 'high' : 'medium';
      return {
        id: `leak_${lead.id}_uncontacted_${Date.parse(now)}`,
        organizationId: lead.organizationId,
        leadId: lead.id,
        leadName: lead.name,
        leakageType: 'uncontacted',
        severity,
        reason: `New lead uncontacted for ${elapsedMinutes} minutes (SLA: ${sla}m).`,
        estimatedRecoverableRevenue: Math.round(estimatedValue * (leadScore >= 70 ? 0.8 : 0.5)),
        currency,
        recommendedAction: 'Trigger immediate automated outreach or SDR call-now.',
        detectedAt: now,
        status: 'active',
        evidence: { elapsedMinutes, sla, state: lead.state, score: leadScore },
      };
    }
  }

  // 2. Stalled Engagement: contacting or engaged lead with stalled response
  if (lead.state === 'contacting' || lead.state === 'engaged' || lead.state === 'qualifying') {
    const sla = LEAD_STATE_SLA_MINUTES[lead.state] ?? 15;
    if (elapsedMinutes > sla * 2) {
      const severity: LeakageSeverity = elapsedMinutes > sla * 6 ? 'critical' : elapsedMinutes > sla * 3 ? 'high' : 'medium';
      return {
        id: `leak_${lead.id}_stalled_${Date.parse(now)}`,
        organizationId: lead.organizationId,
        leadId: lead.id,
        leadName: lead.name,
        leakageType: 'stalled-engagement',
        severity,
        reason: `Lead stalled in ${lead.state} for ${elapsedMinutes} minutes without activity.`,
        estimatedRecoverableRevenue: Math.round(estimatedValue * (lead.state === 'qualifying' ? 0.6 : 0.4)),
        currency,
        recommendedAction: 'Send multi-channel follow-up or assign SDR intervention.',
        detectedAt: now,
        status: 'active',
        evidence: { elapsedMinutes, sla, state: lead.state, score: leadScore },
      };
    }
  }

  // 3. Qualified No Booking: lead qualified but no appointment scheduled
  if (lead.state === 'qualified') {
    const appointments = input.appointments ?? [];
    const activeAppointment = appointments.find(
      (a) => a.leadId === lead.id && (a.status === 'scheduled' || a.status === 'confirmed'),
    );
    const sla = LEAD_STATE_SLA_MINUTES.qualified ?? 60;
    if (!activeAppointment && elapsedMinutes > sla) {
      const severity: LeakageSeverity = elapsedMinutes > sla * 3 ? 'critical' : 'high';
      return {
        id: `leak_${lead.id}_qualified_nobooking_${Date.parse(now)}`,
        organizationId: lead.organizationId,
        leadId: lead.id,
        leadName: lead.name,
        leakageType: 'qualified-no-booking',
        severity,
        reason: `High-value qualified lead has had no appointment scheduled for ${elapsedMinutes} minutes.`,
        estimatedRecoverableRevenue: Math.round(estimatedValue * 0.75),
        currency,
        recommendedAction: 'Closer/SDR call-now with priority booking link to secure appointment.',
        detectedAt: now,
        status: 'active',
        evidence: { elapsedMinutes, sla, state: lead.state, score: leadScore },
      };
    }
  }

  // 4. Booked No Sale: appointment scheduled/past but no outcome recorded
  if (lead.state === 'booked') {
    const appointments = input.appointments ?? [];
    const outcomes = input.outcomes ?? [];
    const hasWonOutcome = outcomes.some((o) => o.leadId === lead.id && o.outcome === 'won');
    if (!hasWonOutcome) {
      const pastAppointment = appointments.find((a) => {
        if (a.leadId !== lead.id) return false;
        const scheduledMs = Date.parse(a.scheduledAt);
        return scheduledMs < nowMs && (nowMs - scheduledMs) > 60 * 60_000; // 1 hr past appointment
      });

      if (pastAppointment) {
        const appointmentElapsedHrs = Math.floor((nowMs - Date.parse(pastAppointment.scheduledAt)) / 3_600_000);
        return {
          id: `leak_${lead.id}_booked_nosale_${Date.parse(now)}`,
          organizationId: lead.organizationId,
          leadId: lead.id,
          leadName: lead.name,
          leakageType: 'booked-no-sale',
          severity: appointmentElapsedHrs > 24 ? 'critical' : 'high',
          reason: `Appointment completed ${appointmentElapsedHrs} hours ago without commercial outcome or closing follow-up.`,
          estimatedRecoverableRevenue: Math.round(estimatedValue * 0.9),
          currency,
          recommendedAction: 'Conduct same-day closing follow-up and log deal outcome or reschedule.',
          detectedAt: now,
          status: 'active',
          evidence: { appointmentId: pastAppointment.id, scheduledAt: pastAppointment.scheduledAt, hoursPast: appointmentElapsedHrs },
        };
      }
    }
  }

  // 5. Stale Lost / Nurture Overdue
  if (lead.state === 'nurture') {
    const sla = LEAD_STATE_SLA_MINUTES.nurture ?? 1440; // 24 hours
    if (elapsedMinutes > sla * 7) { // 7 days in nurture with no reactivation
      return {
        id: `leak_${lead.id}_stale_nurture_${Date.parse(now)}`,
        organizationId: lead.organizationId,
        leadId: lead.id,
        leadName: lead.name,
        leakageType: 'stale-lost',
        severity: 'medium',
        reason: `Lead has been idle in nurture for ${Math.floor(elapsedMinutes / 1440)} days without reactivation campaign.`,
        estimatedRecoverableRevenue: Math.round(estimatedValue * 0.3),
        currency,
        recommendedAction: 'Enroll in automated nurture sequence or re-engagement offer.',
        detectedAt: now,
        status: 'active',
        evidence: { elapsedMinutes, state: lead.state },
      };
    }
  }

  return null;
}
