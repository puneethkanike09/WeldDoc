-- Per-organisation preferred send time for expiry alert digests.

alter table organizations
  add column if not exists alert_email_time text not null default '11:30';

alter table organizations
  add column if not exists alert_email_timezone text not null default 'Asia/Kolkata';

comment on column organizations.alert_email_time is
  'Local HH:MM when expiry digest emails should be sent (24-hour).';

comment on column organizations.alert_email_timezone is
  'IANA timezone for alert_email_time (e.g. Asia/Kolkata).';
