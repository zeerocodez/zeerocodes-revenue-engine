export type RevenueAttributionType =
  | 'lead-source'
  | 'campaign'
  | 'channel'
  | 'sdr-assisted'
  | 'ai-assisted'
  | 'recovered'
  | 'direct';

export interface RevenueAttributionEvent {
  id: string;
  organizationId: string;
  leadId: string;
  opportunityId?: string;
  attributionType: RevenueAttributionType;
  amount: number;
  currency: string;
  source?: string;
  campaignId?: string;
  channel?: string;
  ownerId?: string;
  recordedAt: string;
  evidence: 'won-outcome' | 'closed-won-event' | 'verified-import';
}

export interface RevenueAttributionInput extends Omit<RevenueAttributionEvent, 'amount' | 'recordedAt' | 'evidence'> {
  amount: number;
  recordedAt?: string;
  evidence?: RevenueAttributionEvent['evidence'];
}

/** Revenue is attributable only after an explicit commercial win is evidenced. */
export function createRevenueAttribution(input: RevenueAttributionInput): RevenueAttributionEvent {
  if (!input.organizationId) throw new Error('organizationId is required');
  if (!input.leadId) throw new Error('leadId is required');
  if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error('amount must be greater than zero');
  if (!input.currency) throw new Error('currency is required');

  const evidence = input.evidence ?? 'won-outcome';
  if (evidence !== 'won-outcome' && evidence !== 'closed-won-event' && evidence !== 'verified-import') {
    throw new Error('revenue requires explicit win evidence');
  }

  return {
    ...input,
    amount: Math.round(input.amount),
    recordedAt: input.recordedAt ?? new Date().toISOString(),
    evidence,
  };
}
