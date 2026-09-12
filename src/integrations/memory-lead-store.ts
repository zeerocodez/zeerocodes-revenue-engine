import type { LeadRecord } from '../domain/lead';
import type { LeadStore } from '../application/revenue-engine-service';

export class MemoryLeadStore implements LeadStore {
  private readonly leads = new Map<string, LeadRecord>();

  async get(id: string): Promise<LeadRecord | null> {
    const lead = this.leads.get(id);
    return lead ? structuredClone(lead) : null;
  }

  async save(lead: LeadRecord): Promise<void> {
    this.leads.set(lead.id, structuredClone(lead));
  }

  async list(organizationId: string): Promise<LeadRecord[]> {
    return [...this.leads.values()]
      .filter((lead) => lead.organizationId === organizationId)
      .map((lead) => structuredClone(lead));
  }
}
