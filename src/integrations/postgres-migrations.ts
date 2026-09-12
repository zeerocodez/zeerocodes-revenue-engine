import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { PoolClient } from 'pg';
import { PostgresDatabase } from './postgres';

const migrationDirectory = path.resolve(process.cwd(), 'docs/migrations');

export async function runPostgresMigrations(db: PostgresDatabase): Promise<string[]> {
  await db.query(`create table if not exists schema_migrations (version text primary key, applied_at timestamptz not null default now())`);
  const files = (await readdir(migrationDirectory)).filter((file) => /^\d+_.+\.sql$/.test(file)).sort();
  const applied = new Set((await db.query<{ version: string }>('select version from schema_migrations order by version')).rows.map((row) => row.version));
  const completed: string[] = [];

  for (const file of files) {
    const version = file.split('_', 1)[0];
    if (applied.has(version)) continue;
    const sql = await readFile(path.join(migrationDirectory, file), 'utf8');
    await db.withTenant('migration', async (client: PoolClient) => {
      await client.query(sql);
      await client.query('insert into schema_migrations(version) values ($1)', [version]);
    });
    completed.push(version);
  }
  return completed;
}
