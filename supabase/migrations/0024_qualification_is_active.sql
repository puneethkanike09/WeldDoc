-- Per-qualification active flag: inactive quals stay on the profile page only.
alter table qualification_records
  add column if not exists is_active boolean not null default true;

alter table operator_qualifications
  add column if not exists is_active boolean not null default true;

create index if not exists qualification_records_active_idx
  on qualification_records (org_id, is_active)
  where is_active = true;

create index if not exists operator_qualifications_active_idx
  on operator_qualifications (org_id, is_active)
  where is_active = true;
