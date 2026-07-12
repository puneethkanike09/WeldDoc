alter table organizations
  add column if not exists masterlist_columns jsonb;
