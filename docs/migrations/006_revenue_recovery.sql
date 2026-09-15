create table if not exists sdr_work_items (
  id text primary key,
  organization_id text not null references tenants(id) on delete cascade,
  lead_id text not null references leads(id) on delete cascade,
  owner_id text,
  status text not null check (status in ('open','claimed','completed','cancelled')),
  priority_band text not null check (priority_band in ('critical','high','medium','low')),
  priority_score numeric(10,2) not null default 0,
  deadline_at timestamptz not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists idx_sdr_work_items_tenant_status on sdr_work_items(organization_id, status, deadline_at);
create index if not exists idx_sdr_work_items_tenant_owner on sdr_work_items(organization_id, owner_id, status);
alter table sdr_work_items enable row level security;
create policy sdr_work_items_tenant_isolation on sdr_work_items using (organization_id = current_setting('app.tenant_id', true));

create table if not exists revenue_recovery_idempotency (
  idempotency_key text primary key,
  organization_id text not null references tenants(id) on delete cascade,
  revenue_event_id text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_recovery_idempotency_tenant on revenue_recovery_idempotency(organization_id);
alter table revenue_recovery_idempotency enable row level security;
create policy revenue_recovery_idempotency_tenant_isolation on revenue_recovery_idempotency using (organization_id = current_setting('app.tenant_id', true));
