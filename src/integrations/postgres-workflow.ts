import type { AppointmentRecord, LeadOutcomeRecord, RevenueAttributionRecord, UsageLedgerEntry } from '../domain/revenue-workflow';
import type { RecoveryAttribution } from '../domain/recovery-attribution';
import type { RevenueLeakageOpportunity } from '../domain/revenue-leakage';
import type { SdrWorkItem, SdrScriptPack } from '../domain/sdr-work-item';
import { PostgresDatabase, json, parseJson } from './postgres';

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

  async saveRecoveryAttribution(record: RecoveryAttribution): Promise<void> {
    await this.db.query(`insert into recovery_attributions (id,organization_id,lead_id,leakage_opportunity_id,leakage_type,owner_id,recovered_amount,currency,leakage_value,recovery_rate,recovered_at,recovery_source,evidence,idempotency_key,metadata)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb)
      on conflict (organization_id,idempotency_key) where idempotency_key is not null do nothing`,
      [record.id,record.organizationId,record.leadId,record.leakageOpportunityId,record.leakageType,record.ownerId,record.recoveredAmount,record.currency,record.leakageValue,record.recoveryRate,record.recoveredAt,record.recoverySource,record.evidence,record.idempotencyKey ?? null,json(record.metadata)]);
  }

  async findRecoveryAttributionByIdempotency(organizationId: string, idempotencyKey: string): Promise<RecoveryAttribution | null> {
    const r = await this.db.query<any>('select * from recovery_attributions where organization_id=$1 and idempotency_key=$2 limit 1',[organizationId,idempotencyKey]);
    if (!r.rows[0]) return null;
    const row = r.rows[0];
    return {
      id: row.id,
      organizationId: row.organization_id,
      leadId: row.lead_id,
      leakageOpportunityId: row.leakage_opportunity_id,
      leakageType: row.leakage_type,
      ownerId: row.owner_id,
      recoveredAmount: Number(row.recovered_amount),
      currency: row.currency,
      leakageValue: Number(row.leakage_value),
      recoveryRate: Number(row.recovery_rate),
      recoveredAt: new Date(row.recovered_at).toISOString(),
      recoverySource: row.recovery_source,
      evidence: row.evidence,
      idempotencyKey: row.idempotency_key ?? undefined,
      metadata: parseJson(row.metadata, {}),
    };
  }

  async listRecoveryAttributions(organizationId: string, leadId?: string): Promise<RecoveryAttribution[]> {
    const r = leadId
      ? await this.db.query<any>('select * from recovery_attributions where organization_id=$1 and lead_id=$2 order by recovered_at desc', [organizationId, leadId])
      : await this.db.query<any>('select * from recovery_attributions where organization_id=$1 order by recovered_at desc', [organizationId]);
    return r.rows.map((row) => ({
      id: row.id,
      organizationId: row.organization_id,
      leadId: row.lead_id,
      leakageOpportunityId: row.leakage_opportunity_id,
      leakageType: row.leakage_type,
      ownerId: row.owner_id,
      recoveredAmount: Number(row.recovered_amount),
      currency: row.currency,
      leakageValue: Number(row.leakage_value),
      recoveryRate: Number(row.recovery_rate),
      recoveredAt: new Date(row.recovered_at).toISOString(),
      recoverySource: row.recovery_source,
      evidence: row.evidence,
      idempotencyKey: row.idempotency_key ?? undefined,
      metadata: parseJson(row.metadata, {}),
    }));
  }

  async saveLeakageOpportunity(record: RevenueLeakageOpportunity): Promise<void> {
    await this.db.query(`insert into revenue_leakage_opportunities (id,organization_id,lead_id,lead_name,leakage_type,severity,reason,estimated_recoverable_revenue,currency,recommended_action,detected_at,status,evidence)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb)
      on conflict (id) do update set severity=excluded.severity,reason=excluded.reason,estimated_recoverable_revenue=excluded.estimated_recoverable_revenue,recommended_action=excluded.recommended_action,status=excluded.status,evidence=excluded.evidence`,
      [record.id,record.organizationId,record.leadId,record.leadName,record.leakageType,record.severity,record.reason,record.estimatedRecoverableRevenue,record.currency,record.recommendedAction,record.detectedAt,record.status,json(record.evidence)]);
  }

  async findLeakageOpportunity(organizationId: string, id: string): Promise<RevenueLeakageOpportunity | null> {
    const r = await this.db.query<any>('select * from revenue_leakage_opportunities where organization_id=$1 and id=$2 limit 1',[organizationId,id]);
    if (!r.rows[0]) return null;
    const row = r.rows[0];
    return {
      id: row.id,
      organizationId: row.organization_id,
      leadId: row.lead_id,
      leadName: row.lead_name,
      leakageType: row.leakage_type,
      severity: row.severity,
      reason: row.reason,
      estimatedRecoverableRevenue: Number(row.estimated_recoverable_revenue),
      currency: row.currency,
      recommendedAction: row.recommended_action,
      detectedAt: new Date(row.detected_at).toISOString(),
      status: row.status,
      evidence: parseJson(row.evidence, {}),
    };
  }

  async listLeakageOpportunities(organizationId: string, status?: string): Promise<RevenueLeakageOpportunity[]> {
    const r = status
      ? await this.db.query<any>('select * from revenue_leakage_opportunities where organization_id=$1 and status=$2 order by detected_at desc',[organizationId,status])
      : await this.db.query<any>('select * from revenue_leakage_opportunities where organization_id=$1 order by detected_at desc',[organizationId]);
    return r.rows.map((row) => ({
      id: row.id,
      organizationId: row.organization_id,
      leadId: row.lead_id,
      leadName: row.lead_name,
      leakageType: row.leakage_type,
      severity: row.severity,
      reason: row.reason,
      estimatedRecoverableRevenue: Number(row.estimated_recoverable_revenue),
      currency: row.currency,
      recommendedAction: row.recommended_action,
      detectedAt: new Date(row.detected_at).toISOString(),
      status: row.status,
      evidence: parseJson(row.evidence, {}),
    }));
  }

  async updateLeakageStatus(organizationId: string, id: string, status: string): Promise<void> {
    await this.db.query('update revenue_leakage_opportunities set status=$1 where organization_id=$2 and id=$3', [status, organizationId, id]);
  }

  // SdrWorkItemStore implementation
  async list(organizationId: string): Promise<SdrWorkItem[]> {
    return this.listSdrWorkItems(organizationId);
  }

  async save(item: SdrWorkItem): Promise<void> {
    return this.saveSdrWorkItem(item);
  }

  async saveSdrWorkItem(item: SdrWorkItem): Promise<void> {
    const now = new Date().toISOString();
    await this.db.query(`insert into sdr_work_items (id,organization_id,lead_id,lead_name,priority_score,priority_band,action,why_now,why_escalated,lead_state,intent,recommended_action,deadline_at,sla_minutes,sla_breached,script,disposition_options,owner_id,claimed_at,completed_by,completed_at,disposition,outcome_revenue,currency,leakage_opportunity_id,leakage_type,estimated_recoverable_revenue,status,created_at,updated_at)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb,$17::jsonb,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30)
      on conflict (id) do update set priority_score=excluded.priority_score,priority_band=excluded.priority_band,action=excluded.action,why_now=excluded.why_now,why_escalated=excluded.why_escalated,lead_state=excluded.lead_state,intent=excluded.intent,recommended_action=excluded.recommended_action,deadline_at=excluded.deadline_at,sla_minutes=excluded.sla_minutes,sla_breached=excluded.sla_breached,script=excluded.script,disposition_options=excluded.disposition_options,owner_id=excluded.owner_id,claimed_at=excluded.claimed_at,completed_by=excluded.completed_by,completed_at=excluded.completed_at,disposition=excluded.disposition,outcome_revenue=excluded.outcome_revenue,leakage_opportunity_id=excluded.leakage_opportunity_id,leakage_type=excluded.leakage_type,estimated_recoverable_revenue=excluded.estimated_recoverable_revenue,status=excluded.status,updated_at=excluded.updated_at`,
      [item.id,item.organizationId,item.leadId,item.leadName,item.priorityScore,item.priorityBand,item.action,item.whyNow,item.whyEscalated ?? null,item.leadState,item.intent ?? null,item.recommendedAction,item.deadlineAt,item.slaMinutes,item.slaBreached,json(item.script),json(item.dispositionOptions),item.ownerId ?? null,item.claimedAt ?? null,item.completedBy ?? null,item.completedAt ?? null,item.disposition ?? null,item.outcomeRevenue ?? null,item.currency ?? 'NGN',item.leakageOpportunityId ?? null,item.leakageType ?? null,item.estimatedRecoverableRevenue ?? null,item.status,item.createdAt,now]);
  }

  async getSdrWorkItem(organizationId: string, id: string): Promise<SdrWorkItem | null> {
    const r = await this.db.query<any>('select * from sdr_work_items where organization_id=$1 and id=$2 limit 1', [organizationId, id]);
    if (!r.rows[0]) return null;
    return this.mapSdrWorkItem(r.rows[0]);
  }

  async listSdrWorkItems(organizationId: string): Promise<SdrWorkItem[]> {
    const r = await this.db.query<any>('select * from sdr_work_items where organization_id=$1 order by created_at desc', [organizationId]);
    return r.rows.map((row) => this.mapSdrWorkItem(row));
  }

  async claimSdrWorkItemAtomic(organizationId: string, id: string, ownerId: string, claimedAt = new Date().toISOString()): Promise<SdrWorkItem | null> {
    const r = await this.db.query<any>(
      `update sdr_work_items
       set status = 'claimed', owner_id = $1, claimed_at = $2, updated_at = $2
       where id = $3 and organization_id = $4 and status = 'open'
       returning *`,
      [ownerId, claimedAt, id, organizationId],
    );
    if (!r.rows[0]) return null;
    return this.mapSdrWorkItem(r.rows[0]);
  }

  async completeSdrWorkItem(organizationId: string, id: string, disposition: string, outcomeRevenue?: number, completedBy?: string, completedAt = new Date().toISOString()): Promise<SdrWorkItem | null> {
    const r = await this.db.query<any>(
      `update sdr_work_items
       set status = 'completed', disposition = $1, outcome_revenue = $2, completed_by = $3, completed_at = $4, updated_at = $4
       where id = $5 and organization_id = $6 and status in ('open', 'claimed')
       returning *`,
      [disposition, outcomeRevenue ?? null, completedBy ?? null, completedAt, id, organizationId],
    );
    if (!r.rows[0]) return null;
    return this.mapSdrWorkItem(r.rows[0]);
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

  private mapSdrWorkItem(row: any): SdrWorkItem {
    return {
      id: row.id,
      organizationId: row.organization_id,
      leadId: row.lead_id,
      leadName: row.lead_name,
      priorityScore: Number(row.priority_score),
      priorityBand: row.priority_band,
      action: row.action,
      whyNow: row.why_now,
      whyEscalated: row.why_escalated ?? undefined,
      leadState: row.lead_state,
      intent: row.intent ?? undefined,
      recommendedAction: row.recommended_action,
      deadlineAt: new Date(row.deadline_at).toISOString(),
      slaMinutes: Number(row.sla_minutes),
      slaBreached: Boolean(row.sla_breached),
      script: parseJson(row.script, DEFAULT_SCRIPT),
      dispositionOptions: parseJson(row.disposition_options, []),
      ownerId: row.owner_id ?? undefined,
      claimedAt: row.claimed_at ? new Date(row.claimed_at).toISOString() : undefined,
      completedBy: row.completed_by ?? undefined,
      completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : undefined,
      disposition: row.disposition ?? undefined,
      outcomeRevenue: row.outcome_revenue === null ? undefined : Number(row.outcome_revenue),
      currency: row.currency,
      leakageOpportunityId: row.leakage_opportunity_id ?? undefined,
      leakageType: row.leakage_type ?? undefined,
      estimatedRecoverableRevenue: row.estimated_recoverable_revenue === null ? undefined : Number(row.estimated_recoverable_revenue),
      status: row.status,
      createdAt: new Date(row.created_at).toISOString(),
    };
  }
}
