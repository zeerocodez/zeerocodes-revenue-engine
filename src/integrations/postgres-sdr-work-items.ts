import type { SdrWorkItem } from '../domain/sdr-work-item';
import type { SdrWorkItemStore } from '../application/sdr-queue-service';
import type { RevenueRecoveryTransaction } from '../application/revenue-recovery-service';
import { json, parseJson, type PostgresDatabase } from './postgres';

interface SdrWorkItemRow {
  payload: unknown;
}

export class PostgresSdrWorkItemStore implements SdrWorkItemStore {
  readonly transaction: RevenueRecoveryTransaction;

  constructor(private readonly db: PostgresDatabase) {
    this.transaction = { run: <T>(work: () => Promise<T>) => this.db.withTransaction(async () => work()) };
  }

  async list(organizationId: string): Promise<SdrWorkItem[]> {
    const result = await this.db.query<SdrWorkItemRow>(
      'select payload from sdr_work_items where organization_id = $1 order by deadline_at asc',
      [organizationId],
    );
    return result.rows.map((row) => parseJson<SdrWorkItem>(row.payload, {} as SdrWorkItem));
  }

  async claim(organizationId: string, itemId: string, ownerId: string): Promise<SdrWorkItem | null> {
    const result = await this.db.query<SdrWorkItemRow>(
      `update sdr_work_items
       set status = 'claimed', owner_id = $3,
           payload = jsonb_set(jsonb_set(payload, '{status}', '"claimed"'::jsonb), '{ownerId}', to_jsonb($3::text))
       where organization_id = $1 and id = $2 and status = 'open'
       returning payload`,
      [organizationId, itemId, ownerId],
    );
    return result.rows[0] ? parseJson<SdrWorkItem>(result.rows[0].payload, {} as SdrWorkItem) : null;
  }

  async save(item: SdrWorkItem): Promise<void> {
    await this.db.query(
      `insert into sdr_work_items (id, organization_id, lead_id, owner_id, status, priority_band, priority_score, deadline_at, payload, created_at, completed_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11)
       on conflict (id) do update set owner_id=excluded.owner_id, status=excluded.status,
       priority_band=excluded.priority_band, priority_score=excluded.priority_score,
       deadline_at=excluded.deadline_at, payload=excluded.payload, completed_at=excluded.completed_at`,
      [
        item.id, item.organizationId, item.leadId, item.ownerId ?? null, item.status,
        item.priorityBand, item.priorityScore, item.deadlineAt, json(item), item.createdAt, item.completedAt ?? null,
      ],
    );
  }
}
