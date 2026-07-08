-- Second-process supplementary fillet (multi-process butt qualifications).
alter table qualification_records
  add column if not exists supplementary_fillet_2 boolean not null default false,
  add column if not exists supplementary_fillet_2_position text,
  add column if not exists supplementary_fillet_2_thickness_mm numeric;
