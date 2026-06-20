-- WeldDoc — fields aligned to client welder registry / qualification Excel templates.

alter table qualification_records
  add column if not exists testing_standard text default 'EN ISO 9606-1:2017',
  add column if not exists material_specification text,
  add column if not exists material2_specification text,
  add column if not exists material2_grade text,
  add column if not exists material2_group text,
  add column if not exists dimension_thickness_mm numeric,
  add column if not exists dimension_width_mm numeric,
  add column if not exists dimension_length_mm numeric,
  add column if not exists legacy_document_paths text[] not null default '{}';

alter table validation_records
  add column if not exists kind text not null default 'continuity'
    check (kind in ('continuity', 'revalidation'));
