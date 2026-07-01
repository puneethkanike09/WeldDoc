-- Group qualification sessions — shared plan/test/NDT for multiple people.

do $$ begin
  create type qualification_session_status as enum ('Draft', 'Pending_NDT', 'Closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type qualification_session_member_status as enum (
    'Draft',
    'Pending_NDT',
    'Approved',
    'Failed',
    'Removed'
  );
exception when duplicate_object then null; end $$;

create table if not exists qualification_sessions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  standard welding_standard not null,
  session_status qualification_session_status not null default 'Draft',
  label text,
  shared_plan jsonb not null default '{}'::jsonb,
  shared_test_piece jsonb not null default '{}'::jsonb,
  shared_ndt jsonb not null default '{}'::jsonb,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists qualification_sessions_org_idx
  on qualification_sessions (org_id);

create table if not exists qualification_session_members (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references qualification_sessions (id) on delete cascade,
  org_id uuid not null references organizations (id) on delete cascade,
  welder_id uuid references welders (id) on delete cascade,
  operator_id uuid references operators (id) on delete cascade,
  qualification_id uuid,
  member_status qualification_session_member_status not null default 'Draft',
  ndt_results jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint qualification_session_member_person_chk check (
    (welder_id is not null and operator_id is null)
    or (welder_id is null and operator_id is not null)
  )
);

create unique index if not exists qualification_session_members_welder_uidx
  on qualification_session_members (session_id, welder_id)
  where welder_id is not null;

create unique index if not exists qualification_session_members_operator_uidx
  on qualification_session_members (session_id, operator_id)
  where operator_id is not null;

create index if not exists qualification_session_members_session_idx
  on qualification_session_members (session_id);

create index if not exists qualification_session_members_qual_idx
  on qualification_session_members (qualification_id)
  where qualification_id is not null;

alter table qualification_sessions enable row level security;
alter table qualification_session_members enable row level security;

drop policy if exists qualification_sessions_all on qualification_sessions;
create policy qualification_sessions_all on qualification_sessions
  for all to authenticated
  using (org_id = current_org_id())
  with check (org_id = current_org_id());

drop policy if exists qualification_session_members_all on qualification_session_members;
create policy qualification_session_members_all on qualification_session_members
  for all to authenticated
  using (org_id = current_org_id())
  with check (org_id = current_org_id());
