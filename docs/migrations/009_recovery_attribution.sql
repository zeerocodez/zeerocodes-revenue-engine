create table if not exists revenue_recovery_attributions (
  id text primary key,
  organization_id text not null references tenants(id) on delete cascade,
  lead_id text not null references leads(id) on delete cascade,
  leakage_opportunity_id text not null,
  leakage_type text not null,
  owner_id text,
  recovered_amount numeric(18,2) not null check (recovered_amount > 0),
  currency text not null,
  leakage_value numeric(18,2) not null check (leakage_value >= 0),
  recovery_rate numeric(7,2) not null default 0 check (recovery_rate >= 0 and recovery_rate <= 100),
  recovered_at timestamptz not null,
  recovery_source text not null check (recovery_source in ('sdr','closer','ai','other')),
  evidence text not null check (evidence = 'won-outcome'),
  created_at timestamptz not null default now()
);

create index if not exists idx_recovery_attribution_tenant_date
  on revenue_recovery_attributions(organization_id, recovered_at desc);
create index if not exists idx_recovery_attribution_lead
  on revenue_recovery_attributions(organization_id, lead_id, recovered_at desc);
create index if not exists idx_recovery_attribution_leak
  on revenue_recovery_attributions(organization_id, leakage_opportunity_id);

alter table revenue_recovery_attributions enable row level security;
create policy revenue_recovery_attributions_tenant_isolation
  on revenue_recovery_attributions
  using (organization_id = current_setting('app.tenant_id', true));
