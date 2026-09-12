-- Zeerocodes Revenue Engine — PostgreSQL baseline schema
-- Tenant isolation is enforced by organization_id on every tenant-owned table.
-- Application repositories must always scope reads/writes by organization_id.

create table if not exists tenants (
  id text primary key,
  name text not null,
  slug text not null unique,
  status text not null check (status in ('active', 'suspended')),
  created_at timestamptz not null default now()
);

create table if not exists tenant_users (
  id text primary key,
  tenant_id text not null references tenants(id) on delete cascade,
  user_id text not null,
  email text not null,
  role text not null check (role in ('owner', 'admin', 'manager', 'agent', 'viewer')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create index if not exists idx_tenant_users_user on tenant_users(user_id);

create table if not exists leads (
  id text primary key,
  organization_id text not null references tenants(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  source text,
  state text not null,
  profile jsonb not null default '{}'::jsonb,
  consent boolean not null default true,
  score integer,
  qualification jsonb,
  decision jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_leads_tenant_state on leads(organization_id, state);
create index if not exists idx_leads_tenant_created on leads(organization_id, created_at desc);

create table if not exists conversations (
  id text primary key,
  organization_id text not null references tenants(id) on delete cascade,
  lead_id text not null references leads(id) on delete cascade,
  channel text not null,
  status text not null,
  owner text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  unique (organization_id, lead_id)
);

create index if not exists idx_conversations_tenant on conversations(organization_id, updated_at desc);

create table if not exists messages (
  id text primary key,
  organization_id text not null references tenants(id) on delete cascade,
  lead_id text not null references leads(id) on delete cascade,
  conversation_id text not null references conversations(id) on delete cascade,
  direction text not null,
  actor text not null,
  channel text not null,
  body text not null,
  timestamp timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_messages_conversation on messages(organization_id, conversation_id, timestamp);

create table if not exists lead_events (
  id text primary key,
  organization_id text not null references tenants(id) on delete cascade,
  lead_id text not null references leads(id) on delete cascade,
  type text not null,
  actor text not null,
  timestamp timestamptz not null default now(),
  from_state text,
  to_state text,
  reason text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_lead_events_tenant_lead on lead_events(organization_id, lead_id, timestamp);

create table if not exists client_configurations (
  organization_id text primary key references tenants(id) on delete cascade,
  qualification jsonb not null,
  scoring jsonb not null,
  conversation jsonb not null,
  accepted_service_types jsonb not null default '[]'::jsonb,
  locations jsonb not null default '[]'::jsonb,
  version integer not null default 1,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

-- PostgreSQL row-level security can become the second isolation boundary once
-- application connections use SET LOCAL app.tenant_id per transaction.
-- Do not enable policies until the database connection layer sets that value.
