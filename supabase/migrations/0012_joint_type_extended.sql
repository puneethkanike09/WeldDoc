-- Extended joint types (Lap, Edge, …) for product "Other" — enum stays BW/FW for ISO 9606-1 engine.

alter table qualification_records
  add column if not exists joint_type_extended text;
