import type { QualificationProfile, QualificationResult } from './qualification';
import type { LeadState } from './lead-state';
import type { DecisionResult } from './decision-engine';
import type { LeadTemperature } from './opportunity';

export type LeadIntent =
  | 'unknown' | 'information' | 'pricing' | 'qualification' | 'objection'
  | 'booking' | 'human_request' | 'complaint' | 'stop' | 'purchase';

export interface LeadCommercialProfile {
  estimatedDealValue?: number;
  currency?: string;
  budget?: number;
  serviceType?: string;
}

export interface LeadEngagement {
  lastInboundAt?: string;
  lastOutboundAt?: string;
  inboundMessages: number;
  outboundMessages: number;
  responseSlaMet?: boolean;
  channels?: string[];
}

export interface LeadRouting {
  ownerType?: 'ai' | 'sdr' | 'closer';
  ownerId?: string;
  routeReason?: string;
  routedAt?: string;
}

export interface LeadOutcome {
  appointmentId?: string;
  opportunityId?: string;
  revenueId?: string;
  wonAt?: string;
  lostAt?: string;
  lostReason?: string;
}

export interface LeadRecord {
  id: string;
  organizationId: string;
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  campaignId?: string;
  state: LeadState;
  previousState?: LeadState;
  temperature?: LeadTemperature;
  intent?: LeadIntent;
  profile: QualificationProfile;
  commercial?: LeadCommercialProfile;
  engagement?: LeadEngagement;
  routing?: LeadRouting;
  outcome?: LeadOutcome;
  consent: boolean;
  createdAt: string;
  updatedAt: string;
  score?: number;
  qualification?: QualificationResult;
  decision?: DecisionResult;
  metadata?: Record<string, unknown>;
}

export interface LeadIntakeInput {
  organizationId: string;
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  campaignId?: string;
  profile?: QualificationProfile;
  commercial?: LeadCommercialProfile;
  consent?: boolean;
  metadata?: Record<string, unknown>;
}

export function belongsToOrganization(lead: LeadRecord, organizationId: string): boolean {
  return lead.organizationId === organizationId;
}

export function createLead(input: LeadIntakeInput, now = new Date().toISOString()): LeadRecord {
  if (!input.organizationId.trim()) throw new Error('organizationId is required');
  if (!input.name.trim()) throw new Error('name is required');

  return {
    id: crypto.randomUUID(),
    organizationId: input.organizationId,
    name: input.name.trim(),
    email: input.email?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    source: input.source,
    campaignId: input.campaignId,
    state: 'new',
    profile: input.profile ?? {},
    commercial: input.commercial,
    consent: input.consent ?? false,
    createdAt: now,
    updatedAt: now,
    engagement: { inboundMessages: 0, outboundMessages: 0 },
    metadata: input.metadata,
  };
}
