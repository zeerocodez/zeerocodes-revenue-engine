-- Public landing-page revenue leak audit requests.
create table if not exists audit_requests (
  id text primary key,
  name text not null,
  business text not null,
  email text not null,
  phone text not null,
  website text,
  monthly_lead_volume text not null,
  current_crm text,
  biggest_sales_bottleneck text not null,
  average_deal_value numeric(18,2),
  where_leads_are_lost text,
  status text not null default 'new' check (status in ('new','contacted','qualified','closed')),
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_requests_created on audit_requests(created_at desc);
create index if not exists idx_audit_requests_status on audit_requests(status, created_at desc);
