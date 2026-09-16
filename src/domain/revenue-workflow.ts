import type { RecoveryAttribution } from './recovery-attribution';
import type { RevenueLeakageOpportunity } from './revenue-leakage';
import type { SdrWorkItem } from './sdr-work-item';

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'no_show' | 'cancelled';
export type LeadOutcomeType = 'won' | 'lost' | 'no_sale' | 'no_show' | 'cancelled' | 'unqualified';

export interface AppointmentRecord {
  id: string;
  organizationId: string;
  leadId: string;
  scheduledAt: string;
  status: AppointmentStatus;
  ownerUserId?: string;
  source?: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface LeadOutcomeRecord {
  id: string;
  organizationId: string;
  leadId: string;
  outcome: LeadOutcomeType;
  revenueAmount?: number | null;
  currency: string;
  reason?: string;
  ownerUserId?: string;
  idempotencyKey?: string;
  occurredAt: string;
  metadata?: Record<string, unknown>;
}

export interface RevenueAttributionRecord {
  id: string;
  organizationId: string;
  leadId: string;
  outcomeId: string;
  source?: string;
  campaign?: string;
  medium?: string;
  attributionModel: 'first_touch' | 'last_touch' | 'linear';
  attributedAmount: number;
  currency: string;
  createdAt: string;
}

export interface UsageLedgerEntry {
  id: string;
  organizationId: string;
  leadId?: string;
  eventType: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  amount: number;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export type { RecoveryAttribution, RevenueLeakageOpportunity, SdrWorkItem };
