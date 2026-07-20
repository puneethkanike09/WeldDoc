-- Defense-in-depth: enforce read-only access at the database layer for orgs
-- whose trial/subscription has lapsed. Mirrors getOrgAccess() in TypeScript.
-- Also locks billing columns so org members cannot self-escalate (writes to
-- those columns must go through the service role: webhook / superadmin / checkout).

-- True when the current user's org may write data.
create or replace function current_org_can_write()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select
        case
          when o.billing_exempt then true
          when o.subscription_status = 'active' then true
          when o.subscription_status = 'past_due' then true
          when o.subscription_status = 'trialing'
            and o.trial_ends_at is not null
            and now() < o.trial_ends_at then true
          when o.subscription_status = 'cancelled'
            and o.current_period_end is not null
            and now() < o.current_period_end then true
          else false
        end
      from organizations o
      where o.id = current_org_id()
    ),
    false
  );
$$;

-- Split each org-scoped data table into: always-readable SELECT + write policy
-- that additionally requires current_org_can_write(). Permissive policies are
-- OR'd, so SELECT still works for read-only orgs.
do $$
declare
  t text;
  tables text[] := array[
    'welders',
    'qualification_test_reports',
    'qualification_records',
    'ndt_dt_records',
    'validation_records',
    'operators',
    'operator_qualifications',
    'operator_ndt_records',
    'operator_validations',
    'qualification_sessions',
    'qualification_session_members'
  ];
begin
  foreach t in array tables loop
    execute format('drop policy if exists %I_all on %I;', t, t);
    execute format('drop policy if exists %I_select on %I;', t, t);
    execute format('drop policy if exists %I_write on %I;', t, t);
    execute format(
      'create policy %I_select on %I for select to authenticated using (org_id = current_org_id());',
      t, t
    );
    execute format(
      'create policy %I_write on %I for all to authenticated using (org_id = current_org_id() and current_org_can_write()) with check (org_id = current_org_id() and current_org_can_write());',
      t, t
    );
  end loop;
end $$;

-- ranges_of_approval (no org_id) — scope via parent WPQ, gate writes on can_write.
drop policy if exists ranges_all on ranges_of_approval;
drop policy if exists ranges_select on ranges_of_approval;
drop policy if exists ranges_write on ranges_of_approval;
create policy ranges_select on ranges_of_approval
  for select to authenticated
  using (
    exists (
      select 1 from qualification_records q
      where q.id = ranges_of_approval.wpq_id
        and q.org_id = current_org_id()
    )
  );
create policy ranges_write on ranges_of_approval
  for all to authenticated
  using (
    current_org_can_write() and exists (
      select 1 from qualification_records q
      where q.id = ranges_of_approval.wpq_id
        and q.org_id = current_org_id()
    )
  )
  with check (
    current_org_can_write() and exists (
      select 1 from qualification_records q
      where q.id = ranges_of_approval.wpq_id
        and q.org_id = current_org_id()
    )
  );

-- operator_ranges (no org_id) — scope via parent OQ, gate writes on can_write.
drop policy if exists operator_ranges_all on operator_ranges;
drop policy if exists operator_ranges_select on operator_ranges;
drop policy if exists operator_ranges_write on operator_ranges;
create policy operator_ranges_select on operator_ranges
  for select to authenticated
  using (
    exists (
      select 1 from operator_qualifications oq
      where oq.id = operator_ranges.oq_id
        and oq.org_id = current_org_id()
    )
  );
create policy operator_ranges_write on operator_ranges
  for all to authenticated
  using (
    current_org_can_write() and exists (
      select 1 from operator_qualifications oq
      where oq.id = operator_ranges.oq_id
        and oq.org_id = current_org_id()
    )
  )
  with check (
    current_org_can_write() and exists (
      select 1 from operator_qualifications oq
      where oq.id = operator_ranges.oq_id
        and oq.org_id = current_org_id()
    )
  );

-- import_jobs: keep member read; require can_write to enqueue.
drop policy if exists import_jobs_org_insert on import_jobs;
create policy import_jobs_org_insert on import_jobs
  for insert to authenticated
  with check (org_id = current_org_id() and current_org_can_write());

-- Lock billing columns to the service role. Members keep updating other org
-- columns (name, branding, alert config) via the org_update RLS policy.
revoke update (
  plan_tier,
  subscription_status,
  trial_ends_at,
  current_period_end,
  razorpay_customer_id,
  razorpay_subscription_id,
  razorpay_plan_id,
  subscription_cancel_at_period_end,
  billing_exempt
) on organizations from authenticated;
