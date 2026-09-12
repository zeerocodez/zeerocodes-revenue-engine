import type { QualificationProfile, QualificationResult } from './qualification';
import type { LeadState } from './lead-state';
import type { DecisionResult } from './decision-engine';

export interface LeadRecord {
  id: string;
  organizationId: string;
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  state: LeadState;
  profile: QualificationProfile;
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
  profile?: QualificationProfile;
  consent?: boolean;
  metadata?: Record<string, unknown>;
}

/** Every lead is owned by exactly one tenant/client organization. */
export function belongsToOrganization(lead: LeadRecord, organizationId: string): boolean {
  return lead.organizationId === organizationId;
}
