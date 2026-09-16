-- Revenue Leakage, SDR Work Items, and Recovery Attribution

create table if not exists sdr_work_items (
  id text primary key,
  organization_id text not null references tenants(id) on delete cascade,
  lead_id text not null references leads(id) on delete cascade,
  lead_name text not null,
  priority_score integer not null default 0,
  priority_band text not null check (priority_band in ('critical','high','medium','low')),
  action text not null,
  why_now text not null,
  why_escalated text,
  lead_state text not null,
  intent text,
  recommended_action text not null,
  deadline_at timestamptz not null,
  sla_minutes integer not null default 15,
  sla_breached boolean not null default false,
  script jsonb not null default '{}'::jsonb,
  disposition_options jsonb not null default '[]'::jsonb,
  owner_id text,
  claimed_at timestamptz,
  completed_by text,
  completed_at timestamptz,
  disposition text,
  outcome_revenue numeric(18,2),
  currency text not null default 'NGN',
  leakage_opportunity_id text,
  leakage_type text,
  estimated_recoverable_revenue numeric(18,2),
  status text not null default 'open' check (status in ('open','claimed','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_sdr_work_tenant_status on sdr_work_items(organization_id, status);
create index if not exists idx_sdr_work_tenant_deadline on sdr_work_items(organization_id, deadline_at);
create index if not exists idx_sdr_work_lead on sdr_work_items(organization_id, lead_id);

create table if not exists revenue_leakage_opportunities (
  id text primary key,
  organization_id text not null references tenants(id) on delete cascade,
  lead_id text not null references leads(id) on delete cascade,
  lead_name text not null,
  leakage_type text not null check (leakage_type in ('uncontacted','stalled-engagement','qualified-no-booking','booked-no-sale','stale-lost')),
  severity text not null check (severity in ('critical','high','medium','low')),
  reason text not null,
  estimated_recoverable_revenue numeric(18,2) not null default 0,
  currency text not null default 'NGN',
  recommended_action text not null,
  detected_at timestamptz not null default now(),
  status text not null default 'active' check (status in ('active','recovered','dismissed','expired')),
  evidence jsonb not null default '{}'::jsonb
);
create index if not exists idx_leakage_tenant_status on revenue_leakage_opportunities(organization_id, status);
create index if not exists idx_leakage_tenant_detected on revenue_leakage_opportunities(organization_id, detected_at desc);

create table if not exists recovery_attributions (
  id text primary key,
  organization_id text not null references tenants(id) on delete cascade,
  lead_id text not null references leads(id) on delete cascade,
  leakage_opportunity_id text not null,
  leakage_type text not null,
  owner_id text not null,
  recovered_amount numeric(18,2) not null check (recovered_amount > 0),
  currency text not null default 'NGN',
  leakage_value numeric(18,2) not null default 0,
  recovery_rate numeric(6,2) not null check (recovery_rate >= 0 and recovery_rate <= 100),
  recovered_at timestamptz not null default now(),
  recovery_source text not null default 'sdr' check (recovery_source in ('sdr','closer','ai','other')),
  evidence text not null default 'won-outcome' check (evidence in ('won-outcome')),
  idempotency_key text,
  metadata jsonb not null default '{}'::jsonb
);
create unique index if not exists idx_recovery_idempotency
  on recovery_attributions(organization_id, idempotency_key)
  where idempotency_key is not null;
create index if not exists idx_recovery_tenant_date on recovery_attributions(organization_id, recovered_at desc);

alter table sdr_work_items enable row level security;
alter table revenue_leakage_opportunities enable row level security;
alter table recovery_attributions enable row level security;

create policy sdr_work_items_tenant_isolation on sdr_work_items using (organization_id = current_setting('app.tenant_id', true));
create policy revenue_leakage_opportunities_tenant_isolation on revenue_leakage_opportunities using (organization_id = current_setting('app.tenant_id', true));
create policy recovery_attributions_tenant_isolation on recovery_attributions using (organization_id = current_setting('app.tenant_id', true));
