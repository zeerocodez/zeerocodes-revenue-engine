create table if not exists revenue_control_snapshots (
  id text primary key,
  organization_id text not null references tenants(id) on delete cascade,
  status text not null check (status in ('clear','watch','intervene')),
  currency text not null default 'NGN',
  revenue numeric(18,2) not null default 0,
  revenue_recovered numeric(18,2) not null default 0,
  revenue_per_lead numeric(18,2) not null default 0,
  critical_open_work_items integer not null default 0,
  sla_breaches integer not null default 0,
  open_manager_escalations integer not null default 0,
  at_risk_owners jsonb not null default '[]'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  generated_at timestamptz not null default now()
);
create index if not exists idx_revenue_control_tenant_time on revenue_control_snapshots(organization_id, generated_at desc);
alter table revenue_control_snapshots enable row level security;
create policy revenue_control_snapshots_tenant_isolation on revenue_control_snapshots using (organization_id = current_setting('app.tenant_id', true));
