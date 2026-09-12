# Production deployment

## Required environment

- `NODE_ENV=production`
- `DATABASE_URL`
- `SESSION_SECRET`
- `PORT` (default `3000`)
- optional `DB_POOL_MAX`
- optional `SESSION_TTL_SECONDS`

The application refuses to start in production without PostgreSQL and a session secret.

## Deployment sequence

1. Build the container with `Dockerfile`.
2. Provide `DATABASE_URL` and `SESSION_SECRET` through the platform secret manager.
3. Start the application. The bootstrap runs ordered SQL migrations from `docs/migrations` before opening the HTTP listener.
4. Create the first tenant and membership through the administrative provisioning path; never accept a client-supplied role as authorization.
5. Put the application behind HTTPS and a trusted identity provider that issues bearer sessions. The API verifies the session signature and then loads the tenant role from `tenant_users`.
6. Configure webhook endpoints and external channel credentials outside source control.
7. Run a controlled pilot before enabling paid traffic.

## Transaction boundary

Every authenticated PostgreSQL API request gets a tenant-scoped database transaction. The connection sets `app.tenant_id` with `set_config(..., true)`. All repository queries issued during that request use the same connection. The request commits only when the response is below HTTP 500; otherwise it rolls back.

This makes the lead intake path atomic across lead persistence, lead events, usage ledger entries, webhook delivery records, and other database writes made during the request.

## Revenue workflow

`lead.created -> instant_response task/event -> conversation -> qualification -> score -> decision -> follow-up -> appointment -> closer -> outcome -> revenue_attribution -> nurture/recycle`

The database is the system of record. External WhatsApp/SMS/email/voice providers should be adapters that consume follow-up tasks or outbound webhooks and report delivery/reply events back into the same workflow.

## RLS

Tenant-owned tables use PostgreSQL row-level security and compare `organization_id` with `current_setting('app.tenant_id', true)`. Do not disable RLS in production. Do not use a database role with `BYPASSRLS` for the application.

## Billing

`usage_ledger` is append-oriented and idempotent by `(organization_id, idempotency_key)`. The first ledger events are `lead.intake` and `qualified.lead`; later channel usage and outcome-based charges can use the same ledger.

## Operational checks

- `/api/health` returns database mode and RLS mode.
- Monitor PostgreSQL pool exhaustion, webhook failure rate, follow-up backlog, lead response latency, qualification rate, appointment rate, show rate, close rate, revenue attributed, and nurture recovery.
- Back up PostgreSQL and test restoration before moving beyond pilot.
