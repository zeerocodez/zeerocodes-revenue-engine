create table if not exists follow_up_tasks (
  id text primary key,
  organization_id text not null references tenants(id) on delete cascade,
  lead_id text not null references leads(id) on delete cascade,
  task_type text not null check (task_type in ('instant_response','qualification','reminder','nurture','recycle','human_handoff')),
  channel text not null check (channel in ('whatsapp','sms','email','voice','web')),
  due_at timestamptz not null,
  status text not null check (status in ('pending','processing','completed','cancelled','failed')),
  attempts integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_followups_due on follow_up_tasks(organization_id,status,due_at);
create unique index if not exists idx_followups_idempotency on follow_up_tasks(organization_id,lead_id,task_type,due_at);
alter table follow_up_tasks enable row level security;
create policy follow_up_tasks_tenant_isolation on follow_up_tasks using (organization_id = current_setting('app.tenant_id', true));
