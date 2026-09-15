alter table revenue_control_snapshots
  add column if not exists estimated_recoverable_revenue numeric(18,2) not null default 0,
  add column if not exists revenue_leak_count integer not null default 0;
