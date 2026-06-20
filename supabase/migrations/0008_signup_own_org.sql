-- Each new account gets its own organisation (data isolation between signups).
-- Previously every user was attached to the seeded default org
-- (00000000-0000-0000-0000-000000000001), so all engineers saw the same welders.

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

  insert into public.organizations (name)
  values (v_org_name)
  returning id into v_org_id;

  insert into public.profiles (id, org_id, full_name, email)
  values (new.id, v_org_id, v_name, new.email)
  on conflict (id) do nothing;

  return new;
end;
$$;

-- One-time fix: accounts created before this migration shared the seeded default org.
-- Keep the earliest profile on the default org (existing data); give every later signup a fresh org.
do $$
declare
  r record;
  v_org_id uuid;
begin
  for r in
    select p.id, p.full_name, p.email
    from profiles p
    where p.org_id = '00000000-0000-0000-0000-000000000001'
    order by p.created_at asc
    offset 1
  loop
    insert into public.organizations (name)
    values (coalesce(r.full_name, split_part(r.email, '@', 1)) || '''s Organisation')
    returning id into v_org_id;

    update public.profiles
    set org_id = v_org_id
    where id = r.id;
  end loop;
end $$;
