import type { FollowUpTask } from '../domain/follow-up';
import { PostgresDatabase, json, parseJson } from './postgres';

export class PostgresFollowUpRepository {
  constructor(private readonly db: PostgresDatabase) {}
  async enqueue(task:FollowUpTask):Promise<boolean>{const r=await this.db.query(`insert into follow_up_tasks (id,organization_id,lead_id,task_type,channel,due_at,status,attempts,payload,created_at,updated_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11) on conflict (organization_id,lead_id,task_type,due_at) do nothing`,[task.id,task.organizationId,task.leadId,task.taskType,task.channel,task.dueAt,task.status,task.attempts,json(task.payload),task.createdAt,task.updatedAt]);return r.rowCount===1;}
  async listDue(organizationId:string,limit=50):Promise<FollowUpTask[]>{const r=await this.db.query<any>(`select * from follow_up_tasks where organization_id=$1 and status='pending' and due_at<=now() order by due_at limit $2`,[organizationId,limit]);return r.rows.map(this.fromRow);}
  async complete(id:string):Promise<void>{await this.db.query(`update follow_up_tasks set status='completed',updated_at=now() where id=$1`,[id]);}
  async fail(id:string,error:string):Promise<void>{await this.db.query(`update follow_up_tasks set status=case when attempts+1>=8 then 'failed' else 'pending' end,attempts=attempts+1,last_error=$2,updated_at=now() where id=$1`,[id,error]);}
  private fromRow(row:any):FollowUpTask{return {id:row.id,organizationId:row.organization_id,leadId:row.lead_id,taskType:row.task_type,channel:row.channel,dueAt:new Date(row.due_at).toISOString(),status:row.status,attempts:row.attempts,payload:parseJson(row.payload,{}),lastError:row.last_error??undefined,createdAt:new Date(row.created_at).toISOString(),updatedAt:new Date(row.updated_at).toISOString()};}
}
