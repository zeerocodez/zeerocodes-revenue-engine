import type { FollowUpTask } from '../domain/follow-up';
import { PostgresDatabase, json, parseJson } from './postgres';

type FollowUpRow = {
  id: string; organization_id: string; lead_id: string; task_type: FollowUpTask['taskType'];
  channel: FollowUpTask['channel']; due_at: string | Date; status: FollowUpTask['status'];
  attempts: number; payload: unknown; last_error: string | null; created_at: string | Date; updated_at: string | Date;
};

export class PostgresFollowUpRepository {
  constructor(private readonly db: PostgresDatabase) {}

  async enqueue(task: FollowUpTask): Promise<boolean> {
    const r = await this.db.query(
      `insert into follow_up_tasks (id,organization_id,lead_id,task_type,channel,due_at,status,attempts,payload,created_at,updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11)
       on conflict (organization_id,lead_id,task_type,due_at) do nothing`,
      [task.id,task.organizationId,task.leadId,task.taskType,task.channel,task.dueAt,task.status,task.attempts,json(task.payload),task.createdAt,task.updatedAt],
    );
    return r.rowCount === 1;
  }

  async listDue(organizationId: string, limit = 50): Promise<FollowUpTask[]> {
    const r = await this.db.query<FollowUpRow>(
      `select * from follow_up_tasks
       where organization_id=$1 and status='pending' and due_at<=now()
       order by due_at limit $2`,
      [organizationId, limit],
    );
    return r.rows.map((row) => this.fromRow(row));
  }

  async markProcessing(id: string): Promise<boolean> {
    const r = await this.db.query(
      `update follow_up_tasks set status='processing',updated_at=now()
       where id=$1 and status='pending' and due_at<=now()
       returning id`,
      [id],
    );
    return r.rowCount === 1;
  }

  async complete(id: string): Promise<void> {
    await this.db.query(`update follow_up_tasks set status='completed',updated_at=now() where id=$1 and status='processing'`, [id]);
  }

  async fail(id: string, error: string): Promise<void> {
    await this.db.query(
      `update follow_up_tasks
       set status=case when attempts+1>=8 then 'failed' else 'pending' end,
           attempts=attempts+1,last_error=$2,updated_at=now()
       where id=$1 and status='processing'`,
      [id, error.slice(0, 2000)],
    );
  }

  private fromRow(row: FollowUpRow): FollowUpTask {
    return {
      id: row.id,
      organizationId: row.organization_id,
      leadId: row.lead_id,
      taskType: row.task_type,
      channel: row.channel,
      dueAt: new Date(row.due_at).toISOString(),
      status: row.status,
      attempts: row.attempts,
      payload: parseJson(row.payload, {}),
      lastError: row.last_error ?? undefined,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  }
}
