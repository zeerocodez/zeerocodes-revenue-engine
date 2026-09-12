import type { LeadState } from './lead-state';

export type LeadEventType =
  | 'lead.created'
  | 'lead.scored'
  | 'lead.routed'
  | 'lead.state_changed'
  | 'lead.escalated'
  | 'lead.rejected'
  | 'lead.booked'
  | 'lead.won'
  | 'lead.lost';

export type LeadEventActor = 'system' | 'ai' | 'sdr' | 'closer' | 'admin';

export interface LeadEvent {
  id: string;
  leadId: string;
  organizationId: string;
  type: LeadEventType;
  actor: LeadEventActor;
  timestamp: string;
  fromState?: LeadState;
  toState?: LeadState;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface LeadEventStore {
  append(event: LeadEvent): Promise<void>;
  list(leadId: string): Promise<LeadEvent[]>;
}
