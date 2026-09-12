import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PoolClient } from 'pg';
import { PostgresDatabase } from './postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationDirectory = path.resolve(__dirname, '../../docs/migrations');

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
      // Migration SQL is trusted application code and runs as the deployment database owner.
      await client.query(sql);
      await client.query('insert into schema_migrations(version) values ($1)', [version]);
    });
    completed.push(version);
  }
  return completed;
}
