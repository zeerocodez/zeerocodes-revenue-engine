import { randomUUID } from 'node:crypto';
import type { RevenueIntelligenceResult } from '../application/revenue-intelligence-service';
import type { RevenueControlPlaneSnapshot } from '../domain/revenue-control-plane';
import { buildRevenueControlPlane } from '../domain/revenue-control-plane';
import type { SdrWorkItem, SdrScriptPack } from '../domain/sdr-work-item';
import type { RevenueLeakageOpportunity } from '../domain/revenue-leakage';
import { PostgresDatabase, json, parseJson } from './postgres';

interface FunnelRow {
  leads: string;
  contacted: string;
  engaged: string;
  qualified: string;
  booked: string;
  won: string;
  revenue: string;
  currency: string;
  attributed_revenue: string;
  recovered_revenue: string;
  escalations: string;
}

const DEFAULT_SCRIPT: SdrScriptPack = {
  opening: 'Hi, this is the team following up on your enquiry.',
  objective: 'Understand the need, qualify the opportunity, and secure the next commercial step.',
  qualificationQuestions: [
    'What exactly are you trying to achieve?',
    'When do you need this solved?',
    'Who will make the final decision?',
    'Have you already set aside a budget for it?',
  ],
  objectionResponses: [
    'I understand. Before you decide, can I clarify the one thing that is holding you back?',
    'That makes sense. If we can solve that concern, would you be open to the next step?',
    'No pressure. Would a short call at a better time be more useful?',
  ],
  closing: 'Based on what you have shared, the best next step is to ____. Does that work for you?',
};

/** Read-only live data adapter. Queries are tenant-scoped by the request transaction/RLS. */
export class PostgresRevenueControlPlaneReader {
  constructor(private readonly db: PostgresDatabase) {}

  async calculate(organizationId: string, now = new Date().toISOString()): Promise<RevenueControlPlaneSnapshot> {
    if (!organizationId.trim()) throw new Error('Tenant context is required');

    const result = await this.db.query<FunnelRow>(`
      with funnel as (
        select
          count(*)::text as leads,
          count(*) filter (where state <> 'new')::text as contacted,
          count(*) filter (where state in ('engaged','qualifying','qualified','booked','won'))::text as engaged,
          count(*) filter (where state in ('qualified','booked','won'))::text as qualified,
          count(*) filter (where state in ('booked','won'))::text as booked,
          count(*) filter (where state = 'won')::text as won
        from leads
        where organization_id = $1
      ), revenue as (
        select coalesce(sum(revenue_amount),0)::text as revenue,
               coalesce(max(currency),'NGN') as currency
        from lead_outcomes
        where organization_id = $1 and outcome = 'won'
      ), attribution as (
        select coalesce(sum(attributed_amount),0)::text as attributed_revenue
        from revenue_attributions
        where organization_id = $1
      ), recovery as (
        select coalesce(sum(recovered_amount),0)::text as recovered_revenue
        from recovery_attributions
        where organization_id = $1
      ), escalations as (
        select count(*)::text as escalations
        from lead_events
        where organization_id = $1 and type = 'lead.escalated'
      )
      select funnel.*, revenue.revenue, revenue.currency, attribution.attributed_revenue, recovery.recovered_revenue, escalations.escalations
      from funnel cross join revenue cross join attribution cross join recovery cross join escalations
    `, [organizationId]);

    const row = result.rows[0];
    if (!row) throw new Error('Unable to calculate revenue control plane');

    // Fetch active SDR work items
    const workItemsResult = await this.db.query<any>(
      `select * from sdr_work_items where organization_id = $1 and status in ('open', 'claimed')`,
      [organizationId],
    );
    const workItems: SdrWorkItem[] = workItemsResult.rows.map((r) => ({
      id: r.id,
      organizationId: r.organization_id,
      leadId: r.lead_id,
      leadName: r.lead_name,
      priorityScore: Number(r.priority_score),
      priorityBand: r.priority_band,
      action: r.action,
      whyNow: r.why_now,
      whyEscalated: r.why_escalated ?? undefined,
      leadState: r.lead_state,
      intent: r.intent ?? undefined,
      recommendedAction: r.recommended_action,
      deadlineAt: new Date(r.deadline_at).toISOString(),
      slaMinutes: Number(r.sla_minutes),
      slaBreached: Boolean(r.sla_breached) || Date.parse(now) > Date.parse(r.deadline_at),
      script: parseJson(r.script, DEFAULT_SCRIPT),
      dispositionOptions: parseJson(r.disposition_options, []),
      ownerId: r.owner_id ?? undefined,
      claimedAt: r.claimed_at ? new Date(r.claimed_at).toISOString() : undefined,
      completedBy: r.completed_by ?? undefined,
      completedAt: r.completed_at ? new Date(r.completed_at).toISOString() : undefined,
      disposition: r.disposition ?? undefined,
      outcomeRevenue: r.outcome_revenue === null ? undefined : Number(r.outcome_revenue),
      currency: r.currency,
      leakageOpportunityId: r.leakage_opportunity_id ?? undefined,
      leakageType: r.leakage_type ?? undefined,
      estimatedRecoverableRevenue: r.estimated_recoverable_revenue === null ? undefined : Number(r.estimated_recoverable_revenue),
      status: r.status,
      createdAt: new Date(r.created_at).toISOString(),
    }));

    // Fetch active leakage opportunities
    const leakageResult = await this.db.query<any>(
      `select * from revenue_leakage_opportunities where organization_id = $1 and status = 'active'`,
      [organizationId],
    );
    const leakageOpportunities: RevenueLeakageOpportunity[] = leakageResult.rows.map((r) => ({
      id: r.id,
      organizationId: r.organization_id,
      leadId: r.lead_id,
      leadName: r.lead_name,
      leakageType: r.leakage_type,
      severity: r.severity,
      reason: r.reason,
      estimatedRecoverableRevenue: Number(r.estimated_recoverable_revenue),
      currency: r.currency,
      recommendedAction: r.recommended_action,
      detectedAt: new Date(r.detected_at).toISOString(),
      status: r.status,
      evidence: parseJson(r.evidence, {}),
    }));

    const intelligence: RevenueIntelligenceResult = {
      funnel: {
        leads: Number(row.leads),
        contacted: Number(row.contacted),
        engaged: Number(row.engaged),
        qualified: Number(row.qualified),
        booked: Number(row.booked),
        won: Number(row.won),
        revenue: Math.round(Number(row.revenue)),
        currency: row.currency || 'NGN',
      },
      contactRate: this.rate(Number(row.contacted), Number(row.leads)),
      qualificationRate: this.rate(Number(row.qualified), Number(row.leads)),
      bookingRate: this.rate(Number(row.booked), Number(row.qualified)),
      closeRate: this.rate(Number(row.won), Number(row.booked)),
      revenuePerLead: Number(row.leads) > 0 ? Math.round(Number(row.revenue) / Number(row.leads)) : 0,
      revenueRecovered: Math.round(Number(row.recovered_revenue)),
      attributedRevenue: Math.round(Number(row.attributed_revenue)),
    };

    const snapshot = buildRevenueControlPlane({
      organizationId,
      intelligence,
      workItems,
      performance: [],
      leakageOpportunities,
      managerEscalationCount: Number(row.escalations),
      now,
    });

    await this.persist(snapshot);
    return snapshot;
  }

  async latest(organizationId: string): Promise<RevenueControlPlaneSnapshot | null> {
    if (!organizationId.trim()) throw new Error('Tenant context is required');
    const result = await this.db.query<any>(
      'select * from revenue_control_snapshots where organization_id = $1 order by generated_at desc limit 1',
      [organizationId],
    );
    const row = result.rows[0];
    if (!row) return null;
    const actions = parseJson(row.actions, []);
    return {
      organizationId: row.organization_id,
      currency: row.currency,
      revenue: Number(row.revenue),
      revenueRecovered: Number(row.revenue_recovered),
      revenuePerLead: Number(row.revenue_per_lead),
      criticalOpenWorkItems: Number(row.critical_open_work_items),
      slaBreaches: Number(row.sla_breaches),
      openManagerEscalations: Number(row.open_manager_escalations),
      estimatedRecoverableRevenue: actions.reduce(
        (sum: number, a: any) => (a.type === 'revenue-leakage' ? sum + 100_000 : sum),
        0,
      ),
      revenueLeakCount: actions.filter((a: any) => a.type === 'revenue-leakage').length,
      unrecoveredRevenue: Math.max(0, Number(row.revenue_recovered) ? 0 : 0),
      recoveryRate: Number(row.revenue_recovered) > 0 ? 100 : 0,
      leakageRate: 0,
      atRiskOwners: parseJson(row.at_risk_owners, []),
      actions,
      status: row.status,
      generatedAt: new Date(row.generated_at).toISOString(),
    };
  }

  private async persist(snapshot: RevenueControlPlaneSnapshot): Promise<void> {
    await this.db.query(`
      insert into revenue_control_snapshots
      (id,organization_id,status,currency,revenue,revenue_recovered,revenue_per_lead,critical_open_work_items,sla_breaches,open_manager_escalations,at_risk_owners,actions,generated_at)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12::jsonb,$13)
    `, [
      randomUUID(), snapshot.organizationId, snapshot.status, snapshot.currency, snapshot.revenue,
      snapshot.revenueRecovered, snapshot.revenuePerLead, snapshot.criticalOpenWorkItems,
      snapshot.slaBreaches, snapshot.openManagerEscalations, json(snapshot.atRiskOwners), json(snapshot.actions), snapshot.generatedAt,
    ]);
  }

  private rate(numerator: number, denominator: number): number {
    return denominator <= 0 ? 0 : Math.round((numerator / denominator) * 10000) / 100;
  }
}
