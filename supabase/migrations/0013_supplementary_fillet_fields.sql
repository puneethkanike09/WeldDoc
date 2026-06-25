-- Supplementary fillet test piece fields (Step 2 when plan flag is set).
alter table qualification_records
  add column if not exists supplementary_fillet_position text,
  add column if not exists supplementary_fillet_thickness_mm numeric;
