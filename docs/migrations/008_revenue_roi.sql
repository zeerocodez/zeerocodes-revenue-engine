alter table revenue_control_snapshots
  add column if not exists unrecovered_revenue numeric(18,2) not null default 0,
  add column if not exists recovery_rate numeric(7,2) not null default 0,
  add column if not exists leakage_rate numeric(7,2) not null default 0;
