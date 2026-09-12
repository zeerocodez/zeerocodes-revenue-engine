alter table appointments add column if not exists idempotency_key text;
create unique index if not exists idx_appointments_idempotency
  on appointments(organization_id,idempotency_key)
  where idempotency_key is not null;

alter table lead_outcomes add column if not exists idempotency_key text;
create unique index if not exists idx_lead_outcomes_idempotency
  on lead_outcomes(organization_id,idempotency_key)
  where idempotency_key is not null;
