-- Material 2 dimensions + branch connection style (client registry matrix).

alter table qualification_records
  add column if not exists branch_connection text
    check (branch_connection is null or branch_connection in ('set_in', 'set_on', 'set_through')),
  add column if not exists dimension2_thickness_mm numeric,
  add column if not exists dimension2_width_mm numeric,
  add column if not exists dimension2_length_mm numeric,
  add column if not exists dimension2_pipe_od_mm numeric,
  add column if not exists dimensions2 text;
