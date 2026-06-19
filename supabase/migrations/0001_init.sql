-- WeldDoc MVP — initial schema (EN ISO 9606-1)
-- Single-tenant for MVP but fully organization-scoped for future multi-tenant SaaS.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type welder_status as enum ('Active', 'Inactive', 'Suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type welding_standard as enum ('ISO_9606_1', 'ASME_IX', 'AWS_D1_1');
exception when duplicate_object then null; end $$;

do $$ begin
  create type joint_category as enum ('BW', 'FW');
exception when duplicate_object then null; end $$;

do $$ begin
  create type product_type as enum ('Plate', 'Pipe', 'Branch', 'Other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type wpq_status as enum ('Draft', 'Pending_NDT', 'Approved', 'Failed', 'Expired', 'Superseded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type revalidation_method as enum ('9.3a', '9.3b', '9.3c');
exception when duplicate_object then null; end $$;

do $$ begin
  create type signatory_role as enum ('manufacturer', 'examining_body');
exception when duplicate_object then null; end $$;

do $$ begin
  create type test_result as enum ('Pass', 'Fail', 'NA');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Organizations
-- ---------------------------------------------------------------------------
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_path text,
  location_code text default 'BBSR',
  uid_prefix text not null default 'WLD',
  report_prefix text not null default 'SMS/BBSR/WPQ-',
  wpq_seq integer not null default 100,
  welder_seq integer not null default 0,
  alert_emails text[] not null default '{}',
  alert_lead_days integer[] not null default '{30,7}',
  created_at timestamptz not null default now()
);

-- Seed a single default organization for the MVP.
insert into organizations (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Your Welding Company')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Profiles (welding engineers, linked to auth.users)
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  org_id uuid not null references organizations (id) on delete restrict,
  full_name text,
  email text,
  created_at timestamptz not null default now()
);

create or replace function current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from profiles where id = auth.uid();
$$;

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, org_id, full_name, email)
  values (
    new.id,
    '00000000-0000-0000-0000-000000000001',
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- Signatories
-- ---------------------------------------------------------------------------
create table if not exists signatories (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  designation text,
  organisation text,
  role signatory_role not null default 'manufacturer',
  signature_path text,
  stamp_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Welders
-- ---------------------------------------------------------------------------
create table if not exists welders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  uid text not null,
  welder_id text,
  full_name text not null,
  date_of_birth date,
  place_of_birth text,
  id_method text,
  id_number text,
  employer text,
  branch_location text,
  photo_path text,
  qr_token text not null default encode(gen_random_bytes(9), 'hex'),
  status welder_status not null default 'Active',
  is_new_welder boolean not null default true,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (org_id, uid),
  unique (qr_token)
);

create index if not exists welders_org_idx on welders (org_id);

-- ---------------------------------------------------------------------------
-- Batch qualification test reports (one test session => BW and/or FW sheet)
-- ---------------------------------------------------------------------------
create table if not exists qualification_test_reports (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  report_number text not null,
  joint_category joint_category not null,
  test_date date not null default current_date,
  wps_no text,
  manufacturer_signatory_id uuid references signatories (id) on delete set null,
  examining_body_signatory_id uuid references signatories (id) on delete set null,
  remarks text,
  sheet_pdf_path text,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (org_id, report_number)
);

-- ---------------------------------------------------------------------------
-- Qualification records (WPQ)
-- ---------------------------------------------------------------------------
create table if not exists qualification_records (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  welder_id uuid not null references welders (id) on delete cascade,
  report_id uuid references qualification_test_reports (id) on delete set null,
  standard welding_standard not null default 'ISO_9606_1',
  process text not null,
  joint_type joint_category not null,
  position text,
  product product_type not null default 'Plate',
  base_material_group text,
  material_grade text,
  dimensions text,
  filler_group text,
  filler_designation text,
  filler_type text,
  shielding_gas text,
  current_polarity text,
  test_thickness_mm numeric,
  deposited_thickness_mm numeric,
  pipe_od_mm numeric,
  layer_type text,
  wps_reference text,
  examiner_ref text,
  examiner_name text,
  date_of_welding date,
  revalidation_method revalidation_method not null default '9.3b',
  wpq_status wpq_status not null default 'Draft',
  cloned_from uuid references qualification_records (id) on delete set null,
  is_legacy boolean not null default false,
  certificate_issued_date date,
  certificate_pdf_path text,
  continuity_last_verified date,
  expiry_date date,
  created_at timestamptz not null default now()
);

create index if not exists wpq_welder_idx on qualification_records (welder_id);
create index if not exists wpq_org_idx on qualification_records (org_id);
create index if not exists wpq_expiry_idx on qualification_records (expiry_date);

-- ---------------------------------------------------------------------------
-- Range of approval (auto-generated)
-- ---------------------------------------------------------------------------
create table if not exists ranges_of_approval (
  id uuid primary key default gen_random_uuid(),
  wpq_id uuid not null references qualification_records (id) on delete cascade,
  thickness_min_mm numeric,
  thickness_max_mm numeric,
  thickness_unlimited boolean not null default false,
  pipe_od_min_mm numeric,
  pipe_od_unlimited boolean not null default false,
  approved_positions text[] not null default '{}',
  approved_material_groups text[] not null default '{}',
  approved_joint_types text[] not null default '{}',
  summary text,
  created_at timestamptz not null default now(),
  unique (wpq_id)
);

-- ---------------------------------------------------------------------------
-- NDT / DT records
-- ---------------------------------------------------------------------------
create table if not exists ndt_dt_records (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  wpq_id uuid not null references qualification_records (id) on delete cascade,
  test_method text not null,
  result test_result not null default 'NA',
  report_pdf_path text,
  conducted_by text,
  test_date date,
  created_at timestamptz not null default now()
);

create index if not exists ndt_wpq_idx on ndt_dt_records (wpq_id);

-- ---------------------------------------------------------------------------
-- Validation / continuity records
-- ---------------------------------------------------------------------------
create table if not exists validation_records (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  wpq_id uuid not null references qualification_records (id) on delete cascade,
  validated_on date not null default current_date,
  supporting_doc_path text,
  new_expiry_date date,
  validator_name text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists validation_wpq_idx on validation_records (wpq_id);

-- ---------------------------------------------------------------------------
-- Notification log
-- ---------------------------------------------------------------------------
create table if not exists notification_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  wpq_id uuid references qualification_records (id) on delete cascade,
  welder_id uuid references welders (id) on delete cascade,
  alert_type text not null,
  expiry_date date,
  channel text not null default 'email',
  status text not null default 'sent',
  sent_at timestamptz not null default now()
);

create index if not exists notif_wpq_idx on notification_log (wpq_id, alert_type, expiry_date);

-- ---------------------------------------------------------------------------
-- Sequence helpers
-- ---------------------------------------------------------------------------
create or replace function next_report_number(p_org uuid, p_category joint_category)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seq integer;
  v_prefix text;
begin
  update organizations
    set wpq_seq = wpq_seq + 1
    where id = p_org
    returning wpq_seq, report_prefix into v_seq, v_prefix;
  return v_prefix || v_seq::text;
end;
$$;

create or replace function next_welder_uid(p_org uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seq integer;
  v_prefix text;
begin
  update organizations
    set welder_seq = welder_seq + 1
    where id = p_org
    returning welder_seq, uid_prefix into v_seq, v_prefix;
  return v_prefix || '-' || to_char(now(), 'YYYY') || '-' || lpad(v_seq::text, 3, '0');
end;
$$;
