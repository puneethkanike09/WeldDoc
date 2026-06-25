-- Supplementary fillet weld test (ISO 9606-1 — BW qualification with FW coverage).
alter table qualification_records
  add column if not exists supplementary_fillet_position text,
  add column if not exists supplementary_fillet_thickness_mm numeric;
