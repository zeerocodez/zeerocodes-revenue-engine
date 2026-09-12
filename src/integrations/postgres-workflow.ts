import type { AppointmentRecord, LeadOutcomeRecord, RevenueAttributionRecord, UsageLedgerEntry } from '../domain/revenue-workflow';
import { PostgresDatabase, json, parseJson } from './postgres';

export class PostgresRevenueWorkflowRepository {
  constructor(private readonly db: PostgresDatabase) {}

  async saveAppointment(record: AppointmentRecord): Promise<void> {
    await this.db.query(`insert into appointments (id,organization_id,lead_id,scheduled_at,status,owner_user_id,source,idempotency_key,metadata,created_at,updated_at)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11)
      on conflict (organization_id,idempotency_key) where idempotency_key is not null do update set scheduled_at=excluded.scheduled_at,status=excluded.status,owner_user_id=excluded.owner_user_id,source=excluded.source,metadata=excluded.metadata,updated_at=excluded.updated_at`,
      [record.id,record.organizationId,record.leadId,record.scheduledAt,record.status,record.ownerUserId ?? null,record.source ?? null,record.idempotencyKey ?? null,json(record.metadata),record.createdAt,record.updatedAt]);
  }

  async findAppointmentByIdempotency(organizationId: string, idempotencyKey: string): Promise<AppointmentRecord | null> {
    const r = await this.db.query<any>('select * from appointments where organization_id=$1 and idempotency_key=$2 limit 1',[organizationId,idempotencyKey]);
    if (!r.rows[0]) return null;
    const row=r.rows[0];
    return {id:row.id,organizationId:row.organization_id,leadId:row.lead_id,scheduledAt:new Date(row.scheduled_at).toISOString(),status:row.status,ownerUserId:row.owner_user_id ?? undefined,source:row.source ?? undefined,idempotencyKey:row.idempotency_key ?? undefined,metadata:parseJson(row.metadata,{}),createdAt:new Date(row.created_at).toISOString(),updatedAt:new Date(row.updated_at).toISOString()};
  }

  async listAppointments(organizationId: string, leadId?: string): Promise<AppointmentRecord[]> {
    const r = leadId
      ? await this.db.query<any>('select * from appointments where organization_id=$1 and lead_id=$2 order by scheduled_at desc',[organizationId,leadId])
      : await this.db.query<any>('select * from appointments where organization_id=$1 order by scheduled_at desc',[organizationId]);
    return r.rows.map((row) => ({ id:row.id,organizationId:row.organization_id,leadId:row.lead_id,scheduledAt:new Date(row.scheduled_at).toISOString(),status:row.status,ownerUserId:row.owner_user_id ?? undefined,source:row.source ?? undefined,idempotencyKey:row.idempotency_key ?? undefined,metadata:parseJson(row.metadata,{}),createdAt:new Date(row.created_at).toISOString(),updatedAt:new Date(row.updated_at).toISOString() }));
  }

  async saveOutcome(record: LeadOutcomeRecord): Promise<void> {
    await this.db.query(`insert into lead_outcomes (id,organization_id,lead_id,outcome,revenue_amount,currency,reason,owner_user_id,idempotency_key,occurred_at,metadata)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)
      on conflict (organization_id,idempotency_key) where idempotency_key is not null do update set outcome=excluded.outcome,revenue_amount=excluded.revenue_amount,currency=excluded.currency,reason=excluded.reason,owner_user_id=excluded.owner_user_id,occurred_at=excluded.occurred_at,metadata=excluded.metadata`,
      [record.id,record.organizationId,record.leadId,record.outcome,record.revenueAmount ?? null,record.currency,record.reason ?? null,record.ownerUserId ?? null,record.idempotencyKey ?? null,record.occurredAt,json(record.metadata)]);
  }

  async findOutcomeByIdempotency(organizationId: string, idempotencyKey: string): Promise<LeadOutcomeRecord | null> {
    const r=await this.db.query<any>('select * from lead_outcomes where organization_id=$1 and idempotency_key=$2 limit 1',[organizationId,idempotencyKey]);
    if(!r.rows[0]) return null;
    const row=r.rows[0];
    return {id:row.id,organizationId:row.organization_id,leadId:row.lead_id,outcome:row.outcome,revenueAmount:row.revenue_amount===null?null:Number(row.revenue_amount),currency:row.currency,reason:row.reason ?? undefined,ownerUserId:row.owner_user_id ?? undefined,idempotencyKey:row.idempotency_key ?? undefined,occurredAt:new Date(row.occurred_at).toISOString(),metadata:parseJson(row.metadata,{})};
  }

  async saveAttribution(record: RevenueAttributionRecord): Promise<void> {
    await this.db.query(`insert into revenue_attributions (id,organization_id,lead_id,outcome_id,source,campaign,medium,attribution_model,attributed_amount,currency,created_at)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [record.id,record.organizationId,record.leadId,record.outcomeId,record.source ?? null,record.campaign ?? null,record.medium ?? null,record.attributionModel,record.attributedAmount,record.currency,record.createdAt]);
  }

  async recordUsage(entry: UsageLedgerEntry): Promise<boolean> {
    const r = await this.db.query(`insert into usage_ledger (id,organization_id,lead_id,event_type,quantity,unit_price,currency,idempotency_key,metadata,created_at)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10) on conflict (organization_id,idempotency_key) do nothing`,
      [entry.id,entry.organizationId,entry.leadId ?? null,entry.eventType,entry.quantity,entry.unitPrice,entry.currency,entry.idempotencyKey,json(entry.metadata),entry.createdAt]);
    return r.rowCount === 1;
  }

  async usageSummary(organizationId: string) {
    const r = await this.db.query<{ event_type:string; quantity:string; amount:string }>(`select event_type,sum(quantity)::text quantity,sum(amount)::text amount from usage_ledger where organization_id=$1 group by event_type order by event_type`,[organizationId]);
    return r.rows.map((row) => ({ eventType:row.event_type,quantity:Number(row.quantity),amount:Number(row.amount) }));
  }
}
