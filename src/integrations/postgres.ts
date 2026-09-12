import { AsyncLocalStorage } from 'node:async_hooks';
import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';

type RequestDbContext = { client: PoolClient; tenantId: string };
const requestDbContext = new AsyncLocalStorage<RequestDbContext>();

export class PostgresDatabase {
  readonly pool: Pool;
  constructor(connectionString = process.env.DATABASE_URL) { if (!connectionString) throw new Error('DATABASE_URL is required for PostgreSQL'); this.pool = new Pool({connectionString,max:Number(process.env.DB_POOL_MAX??10)}); }
  async query<T extends QueryResultRow = QueryResultRow>(text:string,values:unknown[]=[]):Promise<QueryResult<T>>{const context=requestDbContext.getStore();return context?context.client.query<T>(text,values):this.pool.query<T>(text,values);}

  async beginRequestTenant(tenantId:string):Promise<()=>Promise<void>>{
    if(!tenantId.trim())throw new Error('Tenant context is required');
    const client=await this.pool.connect();
    try{await client.query('BEGIN');await client.query("SELECT set_config('app.tenant_id', $1, true)",[tenantId]);}
    catch(error){client.release();throw error;}
    let finished=false;
    return async()=>{if(finished)return;finished=true;try{await client.query('COMMIT');}finally{client.release();}};
  }

  async rollbackRequestTenant():Promise<void>{const context=requestDbContext.getStore();if(!context)return;try{await context.client.query('ROLLBACK');}finally{context.client.release();}}

  runRequestContext(tenantId:string,client:PoolClient,next:()=>void):void{requestDbContext.run({client,tenantId},next);}

  async withTenant<T>(tenantId:string,work:(client:PoolClient)=>Promise<T>):Promise<T>{if(!tenantId.trim())throw new Error('Tenant context is required');const client=await this.pool.connect();try{await client.query('BEGIN');await client.query("SELECT set_config('app.tenant_id', $1, true)",[tenantId]);const result=await work(client);await client.query('COMMIT');return result;}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}}
  async close():Promise<void>{await this.pool.end();}
}
export function json(value:unknown):string{return JSON.stringify(value??{});}
export function parseJson<T>(value:unknown,fallback:T):T{if(value==null)return fallback;if(typeof value==='string')return JSON.parse(value) as T;return value as T;}
