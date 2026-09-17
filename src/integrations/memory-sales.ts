import type { DealRecord, DealStage } from '../domain/deal';
import type { ActivityRecord } from '../domain/activity';

export interface SalesRepository {
  listDeals(organizationId: string): Promise<DealRecord[]>;
  getDeal(organizationId: string, id: string): Promise<DealRecord | null>;
  saveDeal(deal: DealRecord): Promise<void>;
  deleteDeal(organizationId: string, id: string): Promise<boolean>;

  listActivities(organizationId: string): Promise<ActivityRecord[]>;
  getActivity(organizationId: string, id: string): Promise<ActivityRecord | null>;
  saveActivity(activity: ActivityRecord): Promise<void>;
  deleteActivity(organizationId: string, id: string): Promise<boolean>;
}

export class MemorySalesRepository implements SalesRepository {
  private deals = new Map<string, DealRecord>();
  private activities = new Map<string, ActivityRecord>();

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults() {
    const defaultDeals: DealRecord[] = [
      {
        id: 'deal_1',
        organizationId: 'zeerocodes-hq',
        title: 'Enterprise Revenue Automation Suite',
        contactName: 'Adeola Adeleke',
        companyName: 'Interswitch Group',
        value: 12500000,
        currency: 'NGN',
        stage: 'negotiation',
        probability: 90,
        ownerId: 'usr_folake',
        ownerName: 'Folake Adeleke',
        expectedCloseDate: '2026-09-30',
        priority: 'critical',
        tags: ['FinTech', 'High-Priority'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'deal_2',
        organizationId: 'zeerocodes-hq',
        title: 'AI SDR Lead Ingestion & Qualification Engine',
        contactName: 'Chima Obi',
        companyName: 'Kuda Microfinance Bank',
        value: 8200000,
        currency: 'NGN',
        stage: 'demo_scheduled',
        probability: 60,
        ownerId: 'usr_emeka',
        ownerName: 'Emeka Nwosu',
        expectedCloseDate: '2026-10-05',
        priority: 'high',
        tags: ['Banking', 'WhatsApp-Inbound'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const defaultActivities: ActivityRecord[] = [
      {
        id: 'act_1',
        organizationId: 'zeerocodes-hq',
        type: 'call',
        title: 'High-Urgency Discovery Call with MD',
        description: 'Discuss enterprise AI qualification criteria and CRM migration roadmap.',
        status: 'pending',
        dueAt: 'Today, 2:00 PM',
        assignedTo: 'usr_emeka',
        assignedToName: 'Emeka Nwosu',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'act_2',
        organizationId: 'zeerocodes-hq',
        type: 'meeting',
        title: 'Platform Demonstration & Revenue ROI Review',
        description: 'Walk through live demo of speed-to-lead queue and SLA automation.',
        status: 'pending',
        dueAt: 'Today, 4:30 PM',
        assignedTo: 'usr_folake',
        assignedToName: 'Folake Adeleke',
        createdAt: new Date().toISOString(),
      },
    ];

    defaultDeals.forEach((d) => this.deals.set(d.id, d));
    defaultActivities.forEach((a) => this.activities.set(a.id, a));
  }

  async listDeals(organizationId: string): Promise<DealRecord[]> {
    return Array.from(this.deals.values()).filter((d) => d.organizationId === organizationId);
  }

  async getDeal(organizationId: string, id: string): Promise<DealRecord | null> {
    const deal = this.deals.get(id);
    if (!deal || deal.organizationId !== organizationId) return null;
    return deal;
  }

  async saveDeal(deal: DealRecord): Promise<void> {
    this.deals.set(deal.id, deal);
  }

  async deleteDeal(organizationId: string, id: string): Promise<boolean> {
    const deal = this.deals.get(id);
    if (!deal || deal.organizationId !== organizationId) return false;
    return this.deals.delete(id);
  }

  async listActivities(organizationId: string): Promise<ActivityRecord[]> {
    return Array.from(this.activities.values()).filter((a) => a.organizationId === organizationId);
  }

  async getActivity(organizationId: string, id: string): Promise<ActivityRecord | null> {
    const activity = this.activities.get(id);
    if (!activity || activity.organizationId !== organizationId) return null;
    return activity;
  }

  async saveActivity(activity: ActivityRecord): Promise<void> {
    this.activities.set(activity.id, activity);
  }

  async deleteActivity(organizationId: string, id: string): Promise<boolean> {
    const activity = this.activities.get(id);
    if (!activity || activity.organizationId !== organizationId) return false;
    return this.activities.delete(id);
  }
}
