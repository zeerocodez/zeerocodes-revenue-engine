export type AuditActor = 'system' | 'ai' | 'sdr' | 'closer' | 'admin';

export type AuditEvent = {
  id: string;
  timestamp: string;
  organizationId: string;
  leadId: string;
  actor: AuditActor;
  action: string;
  fromState?: string;
  toState?: string;
  reason?: string;
  source?: string;
  metadata?: Record<string, unknown>;
};

export function createAuditEvent(input: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
  return {
    ...input,
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
  };
}
