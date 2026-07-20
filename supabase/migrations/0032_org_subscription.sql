-- Razorpay subscription / billing state on organizations.
-- Every org starts on a 30-day full trial ("Starter"); after that they must be
-- on an active paid subscription (Growth / Enterprise) to keep write access.

alter table organizations
  add column if not exists plan_tier text not null default 'starter',
  add column if not exists subscription_status text not null default 'trialing',
  add column if not exists trial_ends_at timestamptz,
  add column if not exists current_period_end timestamptz,
  add column if not exists razorpay_customer_id text,
  add column if not exists razorpay_subscription_id text,
  add column if not exists razorpay_plan_id text,
  add column if not exists subscription_cancel_at_period_end boolean not null default false,
  add column if not exists billing_exempt boolean not null default false;

comment on column organizations.plan_tier is
  'Billing tier: starter | growth | enterprise. Drives welder/operator limits.';
comment on column organizations.subscription_status is
  'trialing | active | past_due | halted | cancelled | expired.';
comment on column organizations.trial_ends_at is
  'UTC instant the free trial ends. Null = no trial window.';
comment on column organizations.current_period_end is
  'UTC instant the paid billing period ends (write access retained until then when cancelled).';
comment on column organizations.billing_exempt is
  'Superadmin flag: skip all billing gates (trial expiry, read-only, welder/operator caps). For test/internal orgs.';

-- Fast lookup of an org by its Razorpay subscription id (webhook path).
create unique index if not exists organizations_razorpay_subscription_id_idx
  on organizations (razorpay_subscription_id)
  where razorpay_subscription_id is not null;

-- Grandfather existing orgs: give everyone a fresh 30-day trial so nobody is
-- locked out the moment this migration runs.
update organizations
set
  plan_tier = 'starter',
  subscription_status = 'trialing',
  trial_ends_at = now() + interval '30 days'
where trial_ends_at is null;

-- New signups start their 30-day trial from account creation.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_name text;
  v_org_name text;
begin
  v_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    split_part(new.email, '@', 1)
  );
  v_org_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'company_name'), ''),
    v_name || '''s Organisation'
  );

  insert into public.organizations (name, plan_tier, subscription_status, trial_ends_at)
  values (v_org_name, 'starter', 'trialing', now() + interval '30 days')
  returning id into v_org_id;

  insert into public.profiles (id, org_id, full_name, email)
  values (new.id, v_org_id, v_name, new.email)
  on conflict (id) do nothing;

  return new;
end;
$$;
