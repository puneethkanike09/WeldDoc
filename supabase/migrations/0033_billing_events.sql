-- Razorpay webhook audit log + idempotency guard.
-- The webhook route inserts one row per delivered event; the unique
-- razorpay_event_id makes reprocessing a no-op (Razorpay retries deliveries).

create table if not exists billing_events (
  id uuid primary key default gen_random_uuid(),
  razorpay_event_id text unique not null,
  org_id uuid references organizations (id) on delete set null,
  event_type text not null,
  razorpay_subscription_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists billing_events_org_id_idx
  on billing_events (org_id);

create index if not exists billing_events_created_at_idx
  on billing_events (created_at desc);

-- Service-role only. No authenticated/anon policies => RLS denies all app access.
alter table billing_events enable row level security;
