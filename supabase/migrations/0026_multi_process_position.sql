-- Second welding position for multi-process butt qualifications (ISO 9606-1 Table 1).
alter table qualification_records
  add column if not exists position_2 text;
