import type { RevenueRecoveryAttribution } from '../domain/revenue-recovery-attribution';
import type { PostgresDatabase } from './postgres';

export interface RevenueRecoveryAttributionStore {
  save(attribution: RevenueRecoveryAttribution): Promise<void>;
  getById(organizationId: string, id: string): Promise<RevenueRecoveryAttribution | null>;
  listByLead(organizationId: string, leadId: string): Promise<RevenueRecoveryAttribution[]>;
}

interface AttributionRow {
  id: string;
  organization_id: string;
  lead_id: string;
  leakage_opportunity_id: string;
  leakage_type: string;
  owner_id: string | null;
  recovered_amount: string;
  currency: string;
  leakage_value: string;
  recovery_rate: string;
  recovered_at: string;
  recovery_source: RevenueRecoveryAttribution['recoverySource'];
  evidence: 'won-outcome';
}

function mapRow(row: AttributionRow): RevenueRecoveryAttribution {
  return {
    id: row.id,
    organizationId: row.organization_id,
    leadId: row.lead_id,
    leakageOpportunityId: row.leakage_opportunity_id,
    leakageType: row.leakage_type,
    ownerId: row.owner_id ?? undefined,
    recoveredAmount: Number(row.recovered_amount),
    currency: row.currency,
    leakageValue: Number(row.leakage_value),
    recoveryRate: Number(row.recovery_rate),
    recoveredAt: row.recovered_at,
    recoverySource: row.recovery_source,
    evidence: row.evidence,
  };
}

export class PostgresRecoveryAttributionStore implements RevenueRecoveryAttributionStore {
  constructor(private readonly db: PostgresDatabase) {}

  async save(attribution: RevenueRecoveryAttribution): Promise<void> {
    await this.db.query(
      `insert into revenue_recovery_attributions
        (id, organization_id, lead_id, leakage_opportunity_id, leakage_type, owner_id,
         recovered_amount, currency, leakage_value, recovery_rate, recovered_at, recovery_source, evidence)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       on conflict (id) do nothing`,
      [attribution.id, attribution.organizationId, attribution.leadId, attribution.leakageOpportunityId,
        attribution.leakageType, attribution.ownerId ?? null, attribution.recoveredAmount, attribution.currency,
        attribution.leakageValue, attribution.recoveryRate, attribution.recoveredAt, attribution.recoverySource, attribution.evidence],
    );
  }

  async getById(organizationId: string, id: string): Promise<RevenueRecoveryAttribution | null> {
    const result = await this.db.query<AttributionRow>(
      `select id, organization_id, lead_id, leakage_opportunity_id, leakage_type, owner_id,
              recovered_amount::text, currency, leakage_value::text, recovery_rate::text,
              recovered_at::text, recovery_source, evidence
         from revenue_recovery_attributions
        where organization_id = $1 and id = $2
        limit 1`,
      [organizationId, id],
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }

  async listByLead(organizationId: string, leadId: string): Promise<RevenueRecoveryAttribution[]> {
    const result = await this.db.query<AttributionRow>(
      `select id, organization_id, lead_id, leakage_opportunity_id, leakage_type, owner_id,
              recovered_amount::text, currency, leakage_value::text, recovery_rate::text,
              recovered_at::text, recovery_source, evidence
         from revenue_recovery_attributions
        where organization_id = $1 and lead_id = $2
        order by recovered_at desc`,
      [organizationId, leadId],
    );
    return result.rows.map(mapRow);
  }
}
