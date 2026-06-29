-- ISO 14732:2025 — welding operators workspace

do $$ begin
  create type operator_welding_type as enum ('Fusion', 'Resistance');
exception when duplicate_object then null; end $$;

do $$ begin
  create type operator_welding_mode as enum ('Mechanized', 'Automatic');
exception when duplicate_object then null; end $$;

do $$ begin
  create type operator_revalidation_method as enum ('6.3a', '6.3b', '6.3c');
exception when duplicate_object then null; end $$;

do $$ begin
  create type operator_qualification_test_method as enum ('Method_1', 'Method_2', 'Method_3', 'Method_4');
exception when duplicate_object then null; end $$;

do $$ begin
  create type operator_technology_knowledge as enum ('Acceptable', 'Not_Acceptable');
exception when duplicate_object then null; end $$;

alter table organizations add column if not exists operator_seq integer not null default 0;

create table if not exists operators (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  uid text not null,
  operator_id text,
  full_name text not null,
  date_of_birth date,
  place_of_birth text,
  id_method text,
  id_number text,
  employer text,
  branch_location text,
  photo_path text,
  email text,
  qr_token text not null default encode(gen_random_bytes(9), 'hex'),
  status welder_status not null default 'Active',
  is_new_operator boolean not null default true,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (org_id, uid),
  unique (qr_token)
);

create index if not exists operators_org_idx on operators (org_id);

create unique index if not exists operators_org_operator_id_unique
  on operators (org_id, lower(trim(operator_id)))
  where operator_id is not null and trim(operator_id) <> '';

create table if not exists operator_qualifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  operator_id uuid not null references operators (id) on delete cascade,
  standard welding_standard not null default 'ISO_14732',
  testing_standard text not null default 'ISO 14732:2025',
  date_of_welding date,
  welding_type operator_welding_type,
  process text,
  product_type text,
  joint_type text,
  welding_mode operator_welding_mode,
  wps_reference text,
  employer_branch text,
  functional_knowledge_ref text,
  welding_technology_knowledge operator_technology_knowledge,
  examiner_ref text,
  examiner_name text,
  revalidation_method operator_revalidation_method not null default '6.3b',
  equipment_power_source text,
  equipment_unit_details text,
  visual_or_remote_control text,
  automatic_joint_tracking text,
  automatic_arc_length_control text,
  single_multi_run text,
  orbital_position text,
  material_backing text,
  material_backing_type text,
  consumable_insert text,
  material_spec_info text,
  test_piece_dimensions_info text,
  filler_designation_info text,
  qualification_test_method operator_qualification_test_method,
  method1_standard text,
  oq_status wpq_status not null default 'Draft',
  cloned_from uuid references operator_qualifications (id) on delete set null,
  is_legacy boolean not null default false,
  certificate_issued_date date,
  certificate_pdf_path text,
  signed_certificate_pdf_path text,
  continuity_last_verified date,
  expiry_date date,
  created_at timestamptz not null default now()
);

create index if not exists oq_operator_idx on operator_qualifications (operator_id);
create index if not exists oq_org_idx on operator_qualifications (org_id);
create index if not exists oq_expiry_idx on operator_qualifications (expiry_date);

create table if not exists operator_ranges (
  id uuid primary key default gen_random_uuid(),
  oq_id uuid not null references operator_qualifications (id) on delete cascade,
  summary text,
  range_lines jsonb not null default '[]',
  created_at timestamptz not null default now(),
  unique (oq_id)
);

create table if not exists operator_ndt_records (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  oq_id uuid not null references operator_qualifications (id) on delete cascade,
  test_method text not null,
  result test_result not null default 'NA',
  report_pdf_path text,
  conducted_by text,
  test_date date,
  created_at timestamptz not null default now()
);

create index if not exists operator_ndt_oq_idx on operator_ndt_records (oq_id);

create table if not exists operator_validations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  oq_id uuid not null references operator_qualifications (id) on delete cascade,
  validated_on date not null default current_date,
  supporting_doc_path text,
  new_expiry_date date,
  validator_name text,
  note text,
  kind text not null default 'continuity',
  created_at timestamptz not null default now()
);

create index if not exists operator_validation_oq_idx on operator_validations (oq_id);

alter table notification_log
  add column if not exists operator_qualification_id uuid references operator_qualifications (id) on delete cascade;

alter table notification_log
  add column if not exists operator_id uuid references operators (id) on delete cascade;

alter table operators enable row level security;
alter table operator_qualifications enable row level security;
alter table operator_ranges enable row level security;
alter table operator_ndt_records enable row level security;
alter table operator_validations enable row level security;

drop policy if exists operators_all on operators;
create policy operators_all on operators
  for all to authenticated
  using (org_id = current_org_id())
  with check (org_id = current_org_id());

drop policy if exists operator_qualifications_all on operator_qualifications;
create policy operator_qualifications_all on operator_qualifications
  for all to authenticated
  using (org_id = current_org_id())
  with check (org_id = current_org_id());

drop policy if exists operator_ndt_records_all on operator_ndt_records;
create policy operator_ndt_records_all on operator_ndt_records
  for all to authenticated
  using (org_id = current_org_id())
  with check (org_id = current_org_id());

drop policy if exists operator_validations_all on operator_validations;
create policy operator_validations_all on operator_validations
  for all to authenticated
  using (org_id = current_org_id())
  with check (org_id = current_org_id());

drop policy if exists operator_ranges_all on operator_ranges;
create policy operator_ranges_all on operator_ranges
  for all to authenticated
  using (
    exists (
      select 1 from operator_qualifications q
      where q.id = operator_ranges.oq_id
        and q.org_id = current_org_id()
    )
  )
  with check (
    exists (
      select 1 from operator_qualifications q
      where q.id = operator_ranges.oq_id
        and q.org_id = current_org_id()
    )
  );

create or replace function next_operator_uid(p_org uuid)
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
    set operator_seq = operator_seq + 1
    where id = p_org
    returning operator_seq, uid_prefix into v_seq, v_prefix;
  return v_prefix || '-OP-' || to_char(now(), 'YYYY') || '-' || lpad(v_seq::text, 3, '0');
end;
$$;
