import type { LeadStore } from './revenue-engine-service';
import type { RevenueWorkflowRepo } from './revenue-recovery-service';
import { detectLeadRevenueLeakage, type RevenueLeakageOpportunity } from '../domain/revenue-leakage';
import { createSdrWorkItem, type SdrWorkItem } from '../domain/sdr-work-item';

export interface LeakageDetectionSummary {
  scannedLeads: number;
  detectedLeakages: RevenueLeakageOpportunity[];
  enqueuedWorkItems: SdrWorkItem[];
  totalRecoverableRevenue: number;
}

export class RevenueLeakageService {
  constructor(
    private readonly leadStore: LeadStore,
    private readonly workflow: RevenueWorkflowRepo,
  ) {}

  async detectAndSyncTenantLeakage(
    organizationId: string,
    now = new Date().toISOString(),
    baselineAverageDealValue = 120_000,
  ): Promise<LeakageDetectionSummary> {
    if (!organizationId?.trim()) throw new Error('organizationId is required');

    const leads = await this.leadStore.list(organizationId);
    const appointments = await this.workflow.listAppointments(organizationId);
    const existingWorkItems = await this.workflow.listSdrWorkItems(organizationId);

    const detectedLeakages: RevenueLeakageOpportunity[] = [];
    const enqueuedWorkItems: SdrWorkItem[] = [];
    let totalRecoverableRevenue = 0;

    for (const lead of leads) {
      // Don't detect leakage on terminal states (won, invalid)
      if (lead.state === 'won' || lead.state === 'invalid') continue;

      const leadAppointments = appointments.filter((a) => a.leadId === lead.id);
      const leakage = detectLeadRevenueLeakage({
        lead,
        appointments: leadAppointments,
        now,
        baselineAverageDealValue,
      });

      if (leakage) {
        detectedLeakages.push(leakage);
        totalRecoverableRevenue += leakage.estimatedRecoverableRevenue;
        await this.workflow.saveLeakageOpportunity(leakage);

        // Check if an open/claimed work item already exists for this lead
        const hasActiveWorkItem = existingWorkItems.some(
          (w) => w.leadId === lead.id && (w.status === 'open' || w.status === 'claimed'),
        );

        if (!hasActiveWorkItem) {
          const priorityBand = leakage.severity === 'critical' ? 'critical' : leakage.severity === 'high' ? 'high' : 'medium';
          const priorityScore = leakage.severity === 'critical' ? 95 : leakage.severity === 'high' ? 80 : 60;
          const nextAction = leakage.leakageType === 'qualified-no-booking' || leakage.leakageType === 'booked-no-sale'
            ? 'sdr-call-now'
            : leakage.severity === 'critical'
              ? 'sdr-call-now'
              : 'send-follow-up';

          const workItem = createSdrWorkItem(
            {
              organizationId,
              leadId: lead.id,
              leadName: lead.name,
              leadState: lead.state,
              priorityScore,
              priorityBand,
              nextAction,
              reason: leakage.reason,
              slaBreached: leakage.severity === 'critical' || leakage.severity === 'high',
              now,
              leakageOpportunityId: leakage.id,
              leakageType: leakage.leakageType,
              estimatedRecoverableRevenue: leakage.estimatedRecoverableRevenue,
              currency: leakage.currency,
            },
            now,
          );

          await this.workflow.saveSdrWorkItem(workItem);
          enqueuedWorkItems.push(workItem);
        }
      }
    }

    return {
      scannedLeads: leads.length,
      detectedLeakages,
      enqueuedWorkItems,
      totalRecoverableRevenue,
    };
  }

  async listActiveLeakage(organizationId: string): Promise<RevenueLeakageOpportunity[]> {
    return this.workflow.listLeakageOpportunities(organizationId, 'active');
  }
}
