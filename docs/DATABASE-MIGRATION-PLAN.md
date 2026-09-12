# Database Migration Plan

## Migration 001 — Core tenant model

Tables:
- `tenants`
- `tenant_users`
- `leads`
- `conversations`
- `messages`
- `lead_events`
- `client_configurations`

## Isolation contract

1. Every tenant-owned record carries `organization_id` or a tenant foreign key.
2. `tenant_users` is the authorization source for user → tenant membership and role.
3. Suspended tenants cannot authenticate application requests.
4. Inactive memberships cannot authenticate application requests.
5. Repository methods must accept tenant scope explicitly for tenant-owned reads.
6. Resource-by-ID queries must include tenant scope in the SQL predicate.
7. Future PostgreSQL RLS will provide a second boundary using `app.tenant_id`.

## Transaction boundary

Lead intake should eventually execute as one transaction:

1. validate tenant membership
2. insert lead
3. calculate qualification/score
4. insert initial lead events
5. record usage meter
6. commit

Conversation message processing should similarly atomically persist the message, lead-state change, and event records.

## Production rollout

- Keep memory repositories available for local development/tests.
- Introduce PostgreSQL repositories behind the existing repository interfaces.
- Run migrations before switching production traffic.
- Backfill/import existing tenant configuration before enabling production reads.
- Enable RLS only after the connection layer reliably sets `app.tenant_id` inside each transaction.
