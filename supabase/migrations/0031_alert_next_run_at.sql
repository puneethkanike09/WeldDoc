-- Next scheduled UTC instant for org expiry-alert digests (in-process minute cron).

alter table organizations
  add column if not exists alert_next_run_at timestamptz;

comment on column organizations.alert_next_run_at is
  'UTC instant when this org is next due for an expiry-alert digest. Null = due on next scheduler tick (until set).';

create index if not exists organizations_alert_next_run_at_idx
  on organizations (alert_next_run_at)
  where cardinality(alert_emails) > 0;
