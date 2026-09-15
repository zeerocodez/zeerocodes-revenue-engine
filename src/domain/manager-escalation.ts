export type ManagerEscalationReason =
  | 'sla-breach'
  | 'repeated-failed-contact'
  | 'high-value-neglected'
  | 'high-value-lost'
  | 'compliance-risk';

export interface ManagerEscalationInput {
  organizationId: string;
  leadId: string;
  priorityScore: number;
  estimatedDealValue?: number;
  slaBreached: boolean;
  failedContactCount: number;
  lost?: boolean;
  doNotContact?: boolean;
}

export interface ManagerEscalationDecision {
  escalate: boolean;
  reasons: ManagerEscalationReason[];
  severity: 'normal' | 'high' | 'critical';
}

/** Keeps manager intervention focused on revenue risk and compliance risk. */
export function evaluateManagerEscalation(input: ManagerEscalationInput): ManagerEscalationDecision {
  const reasons: ManagerEscalationReason[] = [];
  if (input.slaBreached) reasons.push('sla-breach');
  if (input.failedContactCount >= 3) reasons.push('repeated-failed-contact');
  if ((input.estimatedDealValue ?? 0) >= 2_000_000 && input.slaBreached) reasons.push('high-value-neglected');
  if ((input.estimatedDealValue ?? 0) >= 2_000_000 && input.lost) reasons.push('high-value-lost');
  if (input.doNotContact) reasons.push('compliance-risk');

  const critical = reasons.includes('compliance-risk') || reasons.includes('high-value-lost');
  const high = reasons.length > 0;
  return {
    escalate: high,
    reasons,
    severity: critical ? 'critical' : high ? 'high' : 'normal',
  };
}
