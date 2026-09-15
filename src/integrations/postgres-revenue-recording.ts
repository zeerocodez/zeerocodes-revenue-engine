import type { RevenueAttributionEvent } from '../domain/revenue-attribution';
import type { RevenueRecordingStore } from '../application/revenue-recording-service';
import { PostgresDatabase } from './postgres';

interface AttributionRow {
  id: string;
  organization_id: string;
  lead_id: string;
  attributed_amount: string;
  currency: string;
  source: string | null;
  campaign: string | null;
  medium: string | null;
  created_at: string;
}

interface IdempotencyRow {
  revenue_event_id: string;
}

export class PostgresRevenueRecordingStore implements RevenueRecordingStore {
  constructor(private readonly db: PostgresDatabase) {}

  async getById(id: string): Promise<RevenueAttributionEvent | null> {
    const result = await this.db.query<AttributionRow>(
      `select id, organization_id, lead_id, attributed_amount::text, currency, source, campaign, medium, created_at::text
       from revenue_attributions where id = $1`,
      [id],
    );
    return result.rows[0] ? this.toEvent(result.rows[0]) : null;
  }

  async getByIdempotencyKey(key: string): Promise<RevenueAttributionEvent | null> {
    const result = await this.db.query<IdempotencyRow>(
      'select revenue_event_id from revenue_recovery_idempotency where idempotency_key = $1',
      [key],
    );
    if (!result.rows[0]) return null;
    return this.getById(result.rows[0].revenue_event_id);
  }

  async save(event: RevenueAttributionEvent, idempotencyKey: string): Promise<void> {
    const outcomeId = `outcome_${event.id}`;
    await this.db.query(
      `insert into lead_outcomes (id, organization_id, lead_id, outcome, revenue_amount, currency, owner_user_id, occurred_at, metadata)
       values ($1,$2,$3,'won',$4,$5,$6,$7,$8::jsonb)
       on conflict (id) do nothing`,
      [outcomeId, event.organizationId, event.leadId, event.amount, event.currency, event.ownerId ?? null, event.recordedAt, JSON.stringify({ attributionType: event.attributionType, evidence: event.evidence })],
    );
    await this.db.query(
      `insert into revenue_attributions (id, organization_id, lead_id, outcome_id, source, campaign, medium, attribution_model, attributed_amount, currency, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,'recovery',$8,$9,$10)
       on conflict (id) do nothing`,
      [event.id, event.organizationId, event.leadId, outcomeId, event.source ?? null, event.campaignId ?? null, event.channel ?? null, event.amount, event.currency, event.recordedAt],
    );
    await this.db.query(
      `insert into revenue_recovery_idempotency (idempotency_key, organization_id, revenue_event_id)
       values ($1,$2,$3) on conflict (idempotency_key) do nothing`,
      [idempotencyKey, event.organizationId, event.id],
    );
  }

  private toEvent(row: AttributionRow): RevenueAttributionEvent {
    return {
      id: row.id,
      organizationId: row.organization_id,
      leadId: row.lead_id,
      attributionType: 'recovered',
      amount: Number(row.attributed_amount),
      currency: row.currency,
      source: row.source ?? undefined,
      campaignId: row.campaign ?? undefined,
      channel: row.medium ?? undefined,
      recordedAt: row.created_at,
      evidence: 'won-outcome',
    };
  }
}
