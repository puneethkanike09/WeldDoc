-- Multi-process welder qualification (ISO 9606-1): up to two welding processes
-- on one test piece. The existing single columns remain "process 1"; these add
-- an optional second process with its own filler/weld variables and deposited
-- thickness. process_2 IS NULL means a normal single-process qualification.
alter table qualification_records
  add column if not exists process_2 text,
  add column if not exists process2_filler_group text,
  add column if not exists process2_filler_designation text,
  add column if not exists process2_filler_type text,
  add column if not exists process2_shielding_gas text,
  add column if not exists process2_current_polarity text,
  add column if not exists process2_transfer_mode text,
  add column if not exists process2_weld_details text,
  add column if not exists process2_layer_type text,
  add column if not exists process2_deposited_thickness_mm numeric,
  -- When a supplementary fillet is welded on a multi-process butt test, this
  -- records which of the two processes the fillet used (null = single process).
  add column if not exists supplementary_fillet_process text;
