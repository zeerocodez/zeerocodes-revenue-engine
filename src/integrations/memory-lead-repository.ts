import type { LeadRepository, RevenueLead } from './contracts';

export class MemoryLeadRepository implements LeadRepository {
  private readonly leads = new Map<string, RevenueLead>();

  async get(id: string): Promise<RevenueLead | null> {
    return this.leads.get(id) ?? null;
  }

  async save(lead: RevenueLead): Promise<void> {
    this.leads.set(lead.id, { ...lead });
  }

  async list(organizationId: string): Promise<RevenueLead[]> {
    return [...this.leads.values()].filter((lead) => lead.organizationId === organizationId);
  }
}
