import type { Conversation, ConversationStore } from '../domain/conversation';
import type { LeadEvent, LeadEventStore } from '../domain/lead-events';
import type { LeadRecord } from '../domain/lead';
import type { Message, MessageStore } from '../domain/message';
import type { ClientConfiguration, ClientConfigurationStore } from '../domain/client-configuration';
import type { LeadStore } from '../application/revenue-engine-service';
import { PostgresDatabase, json, parseJson } from './postgres';

export class PostgresLeadStore implements LeadStore {
  constructor(private readonly db: PostgresDatabase) {}

  async get(id: string): Promise<LeadRecord | null> {
    const r = await this.db.query<any>('select * from leads where id = $1 limit 1', [id]);
    return r.rows[0] ? leadFromRow(r.rows[0]) : null;
  }

  async save(lead: LeadRecord): Promise<void> {
    await this.db.query(
      `insert into leads (id, organization_id, name, email, phone, source, state, profile, consent, score, qualification, decision, metadata, created_at, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11::jsonb,$12::jsonb,$13::jsonb,$14,$15)
       on conflict (id) do update set name=excluded.name,email=excluded.email,phone=excluded.phone,source=excluded.source,state=excluded.state,
       profile=excluded.profile,consent=excluded.consent,score=excluded.score,qualification=excluded.qualification,decision=excluded.decision,metadata=excluded.metadata,updated_at=excluded.updated_at`,
      [lead.id, lead.organizationId, lead.name, lead.email ?? null, lead.phone ?? null, lead.source ?? null, lead.state, json(lead.profile), lead.consent, lead.score ?? null, json(lead.qualification), json(lead.decision), json(lead.metadata), lead.createdAt, lead.updatedAt],
    );
  }

  async list(organizationId: string): Promise<LeadRecord[]> {
    const r = await this.db.query<any>('select * from leads where organization_id = $1 order by created_at desc', [organizationId]);
    return r.rows.map(leadFromRow);
  }
}

function leadFromRow(row: any): LeadRecord {
  return {
    id: row.id, organizationId: row.organization_id, name: row.name, email: row.email ?? undefined, phone: row.phone ?? undefined,
    source: row.source ?? undefined, state: row.state, profile: parseJson(row.profile, {}), consent: row.consent,
    createdAt: new Date(row.created_at).toISOString(), updatedAt: new Date(row.updated_at).toISOString(), score: row.score ?? undefined,
    qualification: parseJson(row.qualification, undefined), decision: parseJson(row.decision, undefined), metadata: parseJson(row.metadata, {}),
  };
}

export class PostgresConversationStore implements ConversationStore {
  constructor(private readonly db: PostgresDatabase) {}
  async get(id: string): Promise<Conversation | null> {
    const r = await this.db.query<any>('select * from conversations where id = $1 limit 1', [id]);
    return r.rows[0] ? conversationFromRow(r.rows[0]) : null;
  }
  async getByLead(leadId: string): Promise<Conversation | null> {
    const r = await this.db.query<any>('select * from conversations where lead_id = $1 limit 1', [leadId]);
    return r.rows[0] ? conversationFromRow(r.rows[0]) : null;
  }
  async save(c: Conversation): Promise<void> {
    await this.db.query(
      `insert into conversations (id,organization_id,lead_id,channel,status,owner,created_at,updated_at,last_message_at,metadata)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)
       on conflict (id) do update set status=excluded.status,owner=excluded.owner,updated_at=excluded.updated_at,last_message_at=excluded.last_message_at,metadata=excluded.metadata`,
      [c.id,c.organizationId,c.leadId,c.channel,c.status,c.owner,c.createdAt,c.updatedAt,c.lastMessageAt ?? null,json(c.metadata)],
    );
  }
}
function conversationFromRow(row: any): Conversation {
  return { id: row.id, organizationId: row.organization_id, leadId: row.lead_id, channel: row.channel, status: row.status, owner: row.owner,
    createdAt: new Date(row.created_at).toISOString(), updatedAt: new Date(row.updated_at).toISOString(), lastMessageAt: row.last_message_at ? new Date(row.last_message_at).toISOString() : undefined,
    metadata: parseJson(row.metadata, {}) };
}

export class PostgresMessageStore implements MessageStore {
  constructor(private readonly db: PostgresDatabase) {}
  async append(m: Message): Promise<void> {
    await this.db.query(
      `insert into messages (id,organization_id,lead_id,conversation_id,direction,actor,channel,body,timestamp,metadata)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)`,
      [m.id,m.organizationId,m.leadId,m.conversationId,m.direction,m.actor,m.channel,m.body,m.timestamp,json(m.metadata)],
    );
  }
  async list(conversationId: string): Promise<Message[]> {
    const r = await this.db.query<any>('select * from messages where conversation_id = $1 order by timestamp asc', [conversationId]);
    return r.rows.map((row) => ({ id: row.id, organizationId: row.organization_id, leadId: row.lead_id, conversationId: row.conversation_id,
      direction: row.direction, actor: row.actor, channel: row.channel, body: row.body, timestamp: new Date(row.timestamp).toISOString(), metadata: parseJson(row.metadata,{}) }));
  }
}

export class PostgresLeadEventStore implements LeadEventStore {
  constructor(private readonly db: PostgresDatabase) {}
  async append(e: LeadEvent): Promise<void> {
    await this.db.query(
      `insert into lead_events (id,organization_id,lead_id,type,actor,timestamp,from_state,to_state,reason,metadata)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)`,
      [e.id,e.organizationId,e.leadId,e.type,e.actor,e.timestamp,e.fromState ?? null,e.toState ?? null,e.reason ?? null,json(e.metadata)],
    );
  }
  async list(leadId: string): Promise<LeadEvent[]> {
    const r = await this.db.query<any>('select * from lead_events where lead_id = $1 order by timestamp asc', [leadId]);
    return r.rows.map((row) => ({ id: row.id, leadId: row.lead_id, organizationId: row.organization_id, type: row.type, actor: row.actor,
      timestamp: new Date(row.timestamp).toISOString(), fromState: row.from_state ?? undefined, toState: row.to_state ?? undefined, reason: row.reason ?? undefined, metadata: parseJson(row.metadata,{}) }));
  }
}

export class PostgresClientConfigurationStore implements ClientConfigurationStore {
  constructor(private readonly db: PostgresDatabase) {}
  async get(organizationId: string): Promise<ClientConfiguration | null> {
    const r = await this.db.query<any>('select * from client_configurations where organization_id = $1 limit 1', [organizationId]);
    if (!r.rows[0]) return null;
    const row = r.rows[0];
    return { organizationId: row.organization_id, qualification: parseJson(row.qualification, {}), scoring: parseJson(row.scoring, {}), conversation: parseJson(row.conversation, {}),
      acceptedServiceTypes: parseJson(row.accepted_service_types, []), locations: parseJson(row.locations, []), version: row.version, active: row.active, updatedAt: new Date(row.updated_at).toISOString() };
  }
  async save(c: ClientConfiguration): Promise<void> {
    await this.db.query(
      `insert into client_configurations (organization_id,qualification,scoring,conversation,accepted_service_types,locations,version,active,updated_at)
       values ($1,$2::jsonb,$3::jsonb,$4::jsonb,$5::jsonb,$6::jsonb,$7,$8,$9)
       on conflict (organization_id) do update set qualification=excluded.qualification,scoring=excluded.scoring,conversation=excluded.conversation,
       accepted_service_types=excluded.accepted_service_types,locations=excluded.locations,version=excluded.version,active=excluded.active,updated_at=excluded.updated_at`,
      [c.organizationId,json(c.qualification),json(c.scoring),json(c.conversation),json(c.acceptedServiceTypes),json(c.locations),c.version,c.active,c.updatedAt],
    );
  }
}
