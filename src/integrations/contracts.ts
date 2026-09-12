import type { LeadState } from '../domain/lead-state';

export interface RevenueLead {
  id: string;
  organizationId: string;
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  state: LeadState;
  score?: number;
  metadata?: Record<string, unknown>;
}

export interface LeadRepository {
  get(id: string): Promise<RevenueLead | null>;
  save(lead: RevenueLead): Promise<void>;
  list(organizationId: string): Promise<RevenueLead[]>;
}

export interface MessageGateway {
  send(input: { to: string; body: string; channel: 'whatsapp' | 'sms' | 'email' }): Promise<{ providerMessageId: string }>;
}

export interface VoiceGateway {
  call(input: { to: string; leadId: string; scriptId: string }): Promise<{ callId: string }>;
}

export interface PaymentGateway {
  createCheckout(input: { organizationId: string; amount: number; currency: string; reference: string }): Promise<{ checkoutUrl: string; reference: string }>;
}

export interface AdSource {
  syncLeads(organizationId: string): Promise<RevenueLead[]>;
}
