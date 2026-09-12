import type { LeadEvent, LeadEventStore } from '../domain/lead-events';

export class MemoryLeadEventStore implements LeadEventStore {
  private readonly events: LeadEvent[] = [];

  async append(event: LeadEvent): Promise<void> {
    this.events.push(structuredClone(event));
  }

  async list(leadId: string): Promise<LeadEvent[]> {
    return this.events.filter((event) => event.leadId === leadId).map((event) => structuredClone(event));
  }
}
