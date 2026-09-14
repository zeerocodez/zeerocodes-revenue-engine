import type { LeadState } from './lead-state';

export type LeadEventType =
  | 'lead.created'
  | 'lead.scored'
  | 'lead.qualified'
  | 'lead.routed'
  | 'lead.state_changed'
  | 'lead.escalated'
  | 'lead.rejected'
  | 'lead.message_received'
  | 'lead.message_sent'
  | 'lead.follow_up_scheduled'
  | 'lead.booked'
  | 'lead.won'
  | 'lead.lost'
  | 'opportunity.created'
  | 'opportunity.updated'
  | 'revenue.recorded';

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

export function createLeadEvent(
  input: Omit<LeadEvent, 'id' | 'timestamp'>,
  now = new Date().toISOString(),
): LeadEvent {
  return { ...input, id: crypto.randomUUID(), timestamp: now };
}
