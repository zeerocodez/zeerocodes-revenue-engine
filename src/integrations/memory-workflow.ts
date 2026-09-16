import type { AppointmentRecord, LeadOutcomeRecord, RevenueAttributionRecord, UsageLedgerEntry } from '../domain/revenue-workflow';
import type { RecoveryAttribution } from '../domain/recovery-attribution';
import type { RevenueLeakageOpportunity } from '../domain/revenue-leakage';
import type { SdrWorkItem } from '../domain/sdr-work-item';

export class MemoryRevenueWorkflowRepository {
  private appointments: AppointmentRecord[] = [];
  private outcomes: LeadOutcomeRecord[] = [];
  private attributions: RevenueAttributionRecord[] = [];
  private recoveryAttributions: RecoveryAttribution[] = [];
  private leakageOpportunities: RevenueLeakageOpportunity[] = [];
  private sdrWorkItems: SdrWorkItem[] = [];
  private usageEntries: UsageLedgerEntry[] = [];

  async saveAppointment(record: AppointmentRecord): Promise<void> {
    const idx = this.appointments.findIndex(
      (a) => a.id === record.id || (record.idempotencyKey && a.organizationId === record.organizationId && a.idempotencyKey === record.idempotencyKey),
    );
    if (idx >= 0) this.appointments[idx] = structuredClone(record);
    else this.appointments.push(structuredClone(record));
  }

  async findAppointmentByIdempotency(organizationId: string, idempotencyKey: string): Promise<AppointmentRecord | null> {
    const found = this.appointments.find((a) => a.organizationId === organizationId && a.idempotencyKey === idempotencyKey);
    return found ? structuredClone(found) : null;
  }

  async listAppointments(organizationId: string, leadId?: string): Promise<AppointmentRecord[]> {
    return this.appointments
      .filter((a) => a.organizationId === organizationId && (!leadId || a.leadId === leadId))
      .map((a) => structuredClone(a));
  }

  async saveOutcome(record: LeadOutcomeRecord): Promise<void> {
    const idx = this.outcomes.findIndex(
      (o) => o.id === record.id || (record.idempotencyKey && o.organizationId === record.organizationId && o.idempotencyKey === record.idempotencyKey),
    );
    if (idx >= 0) this.outcomes[idx] = structuredClone(record);
    else this.outcomes.push(structuredClone(record));
  }

  async findOutcomeByIdempotency(organizationId: string, idempotencyKey: string): Promise<LeadOutcomeRecord | null> {
    const found = this.outcomes.find((o) => o.organizationId === organizationId && o.idempotencyKey === idempotencyKey);
    return found ? structuredClone(found) : null;
  }

  async listOutcomes(organizationId: string, leadId?: string): Promise<LeadOutcomeRecord[]> {
    return this.outcomes
      .filter((o) => o.organizationId === organizationId && (!leadId || o.leadId === leadId))
      .map((o) => structuredClone(o));
  }

  async saveAttribution(record: RevenueAttributionRecord): Promise<void> {
    this.attributions.push(structuredClone(record));
  }

  async listAttributions(organizationId: string, leadId?: string): Promise<RevenueAttributionRecord[]> {
    return this.attributions
      .filter((a) => a.organizationId === organizationId && (!leadId || a.leadId === leadId))
      .map((a) => structuredClone(a));
  }

  async saveRecoveryAttribution(record: RecoveryAttribution): Promise<void> {
    const exists = this.recoveryAttributions.find(
      (r) =>
        r.id === record.id ||
        (record.idempotencyKey && r.organizationId === record.organizationId && r.idempotencyKey === record.idempotencyKey),
    );
    if (!exists) {
      this.recoveryAttributions.push(structuredClone(record));
    }
  }

  async findRecoveryAttributionByIdempotency(organizationId: string, idempotencyKey: string): Promise<RecoveryAttribution | null> {
    const found = this.recoveryAttributions.find((r) => r.organizationId === organizationId && r.idempotencyKey === idempotencyKey);
    return found ? structuredClone(found) : null;
  }

  async listRecoveryAttributions(organizationId: string, leadId?: string): Promise<RecoveryAttribution[]> {
    return this.recoveryAttributions
      .filter((r) => r.organizationId === organizationId && (!leadId || r.leadId === leadId))
      .map((r) => structuredClone(r));
  }

  async saveLeakageOpportunity(record: RevenueLeakageOpportunity): Promise<void> {
    const idx = this.leakageOpportunities.findIndex((l) => l.id === record.id);
    if (idx >= 0) this.leakageOpportunities[idx] = structuredClone(record);
    else this.leakageOpportunities.push(structuredClone(record));
  }

  async findLeakageOpportunity(organizationId: string, id: string): Promise<RevenueLeakageOpportunity | null> {
    const found = this.leakageOpportunities.find((l) => l.organizationId === organizationId && l.id === id);
    return found ? structuredClone(found) : null;
  }

  async listLeakageOpportunities(organizationId: string, status?: string): Promise<RevenueLeakageOpportunity[]> {
    return this.leakageOpportunities
      .filter((l) => l.organizationId === organizationId && (!status || l.status === status))
      .map((l) => structuredClone(l));
  }

  async updateLeakageStatus(organizationId: string, id: string, status: string): Promise<void> {
    const item = this.leakageOpportunities.find((l) => l.organizationId === organizationId && l.id === id);
    if (item) item.status = status as any;
  }

  // SdrWorkItemStore implementation
  async list(organizationId: string): Promise<SdrWorkItem[]> {
    return this.listSdrWorkItems(organizationId);
  }

  async save(item: SdrWorkItem): Promise<void> {
    return this.saveSdrWorkItem(item);
  }

  async saveSdrWorkItem(item: SdrWorkItem): Promise<void> {
    const idx = this.sdrWorkItems.findIndex((w) => w.id === item.id);
    if (idx >= 0) this.sdrWorkItems[idx] = structuredClone(item);
    else this.sdrWorkItems.push(structuredClone(item));
  }

  async getSdrWorkItem(organizationId: string, id: string): Promise<SdrWorkItem | null> {
    const found = this.sdrWorkItems.find((w) => w.organizationId === organizationId && w.id === id);
    return found ? structuredClone(found) : null;
  }

  async listSdrWorkItems(organizationId: string): Promise<SdrWorkItem[]> {
    return this.sdrWorkItems
      .filter((w) => w.organizationId === organizationId)
      .map((w) => structuredClone(w));
  }

  async claimSdrWorkItemAtomic(organizationId: string, id: string, ownerId: string, claimedAt = new Date().toISOString()): Promise<SdrWorkItem | null> {
    const item = this.sdrWorkItems.find((w) => w.organizationId === organizationId && w.id === id && w.status === 'open');
    if (!item) return null;
    item.status = 'claimed';
    item.ownerId = ownerId;
    item.claimedAt = claimedAt;
    return structuredClone(item);
  }

  async completeSdrWorkItem(organizationId: string, id: string, disposition: string, outcomeRevenue?: number, completedBy?: string, completedAt = new Date().toISOString()): Promise<SdrWorkItem | null> {
    const item = this.sdrWorkItems.find((w) => w.organizationId === organizationId && w.id === id && (w.status === 'open' || w.status === 'claimed'));
    if (!item) return null;
    item.status = 'completed';
    item.disposition = disposition as any;
    item.outcomeRevenue = outcomeRevenue;
    item.completedBy = completedBy;
    item.completedAt = completedAt;
    return structuredClone(item);
  }

  async recordUsage(entry: UsageLedgerEntry): Promise<boolean> {
    const exists = this.usageEntries.some((u) => u.organizationId === entry.organizationId && u.idempotencyKey === entry.idempotencyKey);
    if (exists) return false;
    this.usageEntries.push(structuredClone(entry));
    return true;
  }

  async usageSummary(organizationId: string) {
    const scoped = this.usageEntries.filter((u) => u.organizationId === organizationId);
    const map = new Map<string, { quantity: number; amount: number }>();
    for (const entry of scoped) {
      const cur = map.get(entry.eventType) || { quantity: 0, amount: 0 };
      cur.quantity += entry.quantity;
      cur.amount += entry.amount;
      map.set(entry.eventType, cur);
    }
    return [...map.entries()].map(([eventType, data]) => ({
      eventType,
      quantity: data.quantity,
      amount: data.amount,
    }));
  }
}
