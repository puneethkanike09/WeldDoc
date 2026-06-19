-- WeldDoc MVP — Row Level Security
-- Authenticated engineers can only access rows belonging to their organization.
-- The public auditor verification page reads via the server-side service role
-- (which bypasses RLS), so no anon policies are required here.

alter table organizations enable row level security;
alter table profiles enable row level security;
alter table signatories enable row level security;
alter table welders enable row level security;
alter table qualification_test_reports enable row level security;
alter table qualification_records enable row level security;
alter table ranges_of_approval enable row level security;
alter table ndt_dt_records enable row level security;
alter table validation_records enable row level security;
alter table notification_log enable row level security;

-- Organizations: members can read/update their own org.
drop policy if exists org_select on organizations;
create policy org_select on organizations
  for select to authenticated
  using (id = current_org_id());

drop policy if exists org_update on organizations;
create policy org_update on organizations
  for update to authenticated
  using (id = current_org_id());

-- Profiles: a user can read profiles in their org and update their own.
drop policy if exists profile_select on profiles;
create policy profile_select on profiles
  for select to authenticated
  using (org_id = current_org_id());

drop policy if exists profile_update on profiles;
create policy profile_update on profiles
  for update to authenticated
  using (id = auth.uid());

-- Generic org-scoped policy generator for the remaining tables.
do $$
declare
  t text;
  tables text[] := array[
    'signatories',
    'welders',
    'qualification_test_reports',
    'qualification_records',
    'ndt_dt_records',
    'validation_records',
    'notification_log'
  ];
begin
  foreach t in array tables loop
    execute format('drop policy if exists %I_all on %I;', t, t);
    execute format(
      'create policy %I_all on %I for all to authenticated using (org_id = current_org_id()) with check (org_id = current_org_id());',
      t, t
    );
  end loop;
end $$;

-- ranges_of_approval has no org_id; scope it through its parent WPQ.
drop policy if exists ranges_all on ranges_of_approval;
create policy ranges_all on ranges_of_approval
  for all to authenticated
  using (
    exists (
      select 1 from qualification_records q
      where q.id = ranges_of_approval.wpq_id
        and q.org_id = current_org_id()
    )
  )
  with check (
    exists (
      select 1 from qualification_records q
      where q.id = ranges_of_approval.wpq_id
        and q.org_id = current_org_id()
    )
  );
