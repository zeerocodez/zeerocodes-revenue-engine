import { createHmac, randomUUID } from 'node:crypto';
import type { PostgresDatabase } from './postgres';
import { json } from './postgres';

export interface RevenueWebhookEvent {
  id: string;
  organizationId: string;
  type: string;
  occurredAt: string;
  payload: Record<string, unknown>;
}

export class WebhookDispatcher {
  constructor(private readonly db: PostgresDatabase) {}

  async enqueue(event: RevenueWebhookEvent): Promise<number> {
    const endpoints = await this.db.query<any>(`select id,url,secret_hash,event_types from webhook_endpoints where organization_id=$1 and active=true`,[event.organizationId]);
    let count = 0;
    for (const endpoint of endpoints.rows) {
      const eventTypes = Array.isArray(endpoint.event_types) ? endpoint.event_types : [];
      if (eventTypes.length && !eventTypes.includes(event.type)) continue;
      await this.db.query(`insert into webhook_deliveries (id,endpoint_id,organization_id,event_id,event_type,payload,status,next_attempt_at)
        values ($1,$2,$3,$4,$5,$6::jsonb,'pending',now()) on conflict (endpoint_id,event_id) do nothing`,
        [randomUUID(),endpoint.id,event.organizationId,event.id,event.type,json(event.payload)]);
      count++;
    }
    return count;
  }

  async deliverPending(limit = 20): Promise<number> {
    const pending = await this.db.query<any>(`select d.id,d.endpoint_id,d.event_type,d.payload,e.url,e.secret_hash from webhook_deliveries d join webhook_endpoints e on e.id=d.endpoint_id where d.status='pending' and (d.next_attempt_at is null or d.next_attempt_at <= now()) order by d.created_at limit $1`,[limit]);
    let delivered = 0;
    for (const delivery of pending.rows) {
      const body = JSON.stringify(delivery.payload);
      const signature = createHmac('sha256', delivery.secret_hash).update(body).digest('hex');
      try {
        const response = await fetch(delivery.url,{method:'POST',headers:{'content-type':'application/json','x-zeerocodes-event':delivery.event_type,'x-zeerocodes-signature':signature},body});
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await this.db.query(`update webhook_deliveries set status='delivered',attempts=attempts+1,response_code=$2,delivered_at=now() where id=$1`,[delivery.id,response.status]);
        delivered++;
      } catch (error) {
        await this.db.query(`update webhook_deliveries set status=case when attempts+1 >= 8 then 'failed' else 'pending' end,attempts=attempts+1,last_error=$2,next_attempt_at=now() + ((least(attempts+1,6)::text || ' minutes')::interval) where id=$1`,[delivery.id,error instanceof Error ? error.message : 'Webhook delivery failed']);
      }
    }
    return delivered;
  }
}
