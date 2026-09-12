-- Operating workflow: lead -> response -> conversation -> qualification -> score
-- -> decision -> follow-up -> appointment -> closer -> outcome -> attribution -> nurture.

create table if not exists appointments (
  id text primary key,
  organization_id text not null references tenants(id) on delete cascade,
  lead_id text not null references leads(id) on delete cascade,
  scheduled_at timestamptz not null,
  status text not null check (status in ('scheduled','confirmed','completed','no_show','cancelled')),
  owner_user_id text,
  source text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_appointments_tenant_date on appointments(organization_id, scheduled_at);

create table if not exists lead_outcomes (
  id text primary key,
  organization_id text not null references tenants(id) on delete cascade,
  lead_id text not null references leads(id) on delete cascade,
  outcome text not null check (outcome in ('won','lost','no_sale','no_show','cancelled','unqualified')),
  revenue_amount numeric(18,2),
  currency text not null default 'NGN',
  reason text,
  owner_user_id text,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists idx_outcomes_tenant_date on lead_outcomes(organization_id, occurred_at desc);

create table if not exists revenue_attributions (
  id text primary key,
  organization_id text not null references tenants(id) on delete cascade,
  lead_id text not null references leads(id) on delete cascade,
  outcome_id text not null references lead_outcomes(id) on delete cascade,
  source text,
  campaign text,
  medium text,
  attribution_model text not null default 'first_touch',
  attributed_amount numeric(18,2) not null default 0,
  currency text not null default 'NGN',
  created_at timestamptz not null default now()
);
create index if not exists idx_attribution_tenant on revenue_attributions(organization_id, created_at desc);

create table if not exists usage_ledger (
  id text primary key,
  organization_id text not null references tenants(id) on delete cascade,
  lead_id text references leads(id) on delete set null,
  event_type text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(18,2) not null default 0,
  currency text not null default 'NGN',
  amount numeric(18,2) generated always as (quantity * unit_price) stored,
  idempotency_key text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (organization_id, idempotency_key)
);
create index if not exists idx_usage_tenant_date on usage_ledger(organization_id, created_at desc);

create table if not exists billing_accounts (
  organization_id text primary key references tenants(id) on delete cascade,
  currency text not null default 'NGN',
  billing_model text not null default 'pay_per_qualified_lead',
  monthly_commitment numeric(18,2) not null default 0,
  qualified_lead_price numeric(18,2) not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists webhook_endpoints (
  id text primary key,
  organization_id text not null references tenants(id) on delete cascade,
  url text not null,
  secret_hash text not null,
  event_types jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_webhooks_tenant on webhook_endpoints(organization_id, active);

create table if not exists webhook_deliveries (
  id text primary key,
  endpoint_id text not null references webhook_endpoints(id) on delete cascade,
  organization_id text not null references tenants(id) on delete cascade,
  event_id text not null,
  event_type text not null,
  payload jsonb not null,
  status text not null check (status in ('pending','delivered','failed')),
  attempts integer not null default 0,
  next_attempt_at timestamptz,
  response_code integer,
  last_error text,
  created_at timestamptz not null default now(),
  delivered_at timestamptz
);
create unique index if not exists idx_webhook_delivery_event on webhook_deliveries(endpoint_id, event_id);

-- RLS is intentionally enabled only for tenant-owned operational tables.
-- The application transaction MUST set app.tenant_id before querying them.

alter table leads enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table lead_events enable row level security;
alter table client_configurations enable row level security;
alter table appointments enable row level security;
alter table lead_outcomes enable row level security;
alter table revenue_attributions enable row level security;
alter table usage_ledger enable row level security;
alter table billing_accounts enable row level security;
alter table webhook_endpoints enable row level security;
alter table webhook_deliveries enable row level security;

create policy leads_tenant_isolation on leads using (organization_id = current_setting('app.tenant_id', true));
create policy conversations_tenant_isolation on conversations using (organization_id = current_setting('app.tenant_id', true));
create policy messages_tenant_isolation on messages using (organization_id = current_setting('app.tenant_id', true));
create policy lead_events_tenant_isolation on lead_events using (organization_id = current_setting('app.tenant_id', true));
create policy client_configurations_tenant_isolation on client_configurations using (organization_id = current_setting('app.tenant_id', true));
create policy appointments_tenant_isolation on appointments using (organization_id = current_setting('app.tenant_id', true));
create policy lead_outcomes_tenant_isolation on lead_outcomes using (organization_id = current_setting('app.tenant_id', true));
create policy revenue_attributions_tenant_isolation on revenue_attributions using (organization_id = current_setting('app.tenant_id', true));
create policy usage_ledger_tenant_isolation on usage_ledger using (organization_id = current_setting('app.tenant_id', true));
create policy billing_accounts_tenant_isolation on billing_accounts using (organization_id = current_setting('app.tenant_id', true));
create policy webhook_endpoints_tenant_isolation on webhook_endpoints using (organization_id = current_setting('app.tenant_id', true));
create policy webhook_deliveries_tenant_isolation on webhook_deliveries using (organization_id = current_setting('app.tenant_id', true));

create table if not exists schema_migrations (
  version text primary key,
  applied_at timestamptz not null default now()
);
