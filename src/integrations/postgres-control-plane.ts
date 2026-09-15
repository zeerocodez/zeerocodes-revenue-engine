import { randomUUID } from 'node:crypto';
import type { RevenueIntelligenceResult } from '../application/revenue-intelligence-service';
import type { RevenueControlPlaneSnapshot } from '../domain/revenue-control-plane';
import { buildRevenueControlPlane } from '../domain/revenue-control-plane';
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
  escalations: string;
}

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
      ), escalations as (
        select count(*)::text as escalations
        from lead_events
        where organization_id = $1 and type = 'lead.escalated'
      )
      select funnel.*, revenue.revenue, revenue.currency, attribution.attributed_revenue, escalations.escalations
      from funnel cross join revenue cross join attribution cross join escalations
    `, [organizationId]);

    const row = result.rows[0];
    if (!row) throw new Error('Unable to calculate revenue control plane');

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
      revenueRecovered: 0,
      attributedRevenue: Math.round(Number(row.attributed_revenue)),
    };

    const snapshot = buildRevenueControlPlane({
      organizationId,
      intelligence,
      workItems: [],
      performance: [],
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
    return {
      organizationId: row.organization_id,
      currency: row.currency,
      revenue: Number(row.revenue),
      revenueRecovered: Number(row.revenue_recovered),
      revenuePerLead: Number(row.revenue_per_lead),
      criticalOpenWorkItems: Number(row.critical_open_work_items),
      slaBreaches: Number(row.sla_breaches),
      openManagerEscalations: Number(row.open_manager_escalations),
      atRiskOwners: parseJson(row.at_risk_owners, []),
      actions: parseJson(row.actions, []),
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
