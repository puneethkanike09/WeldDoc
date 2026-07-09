-- Organisation alert email frequency + remove personal welder/operator emails.

alter table organizations
  add column if not exists alert_email_frequency text not null default 'once';

comment on column organizations.alert_email_frequency is
  'once | daily | every_2_days | weekly | twice_weekly | every_3_weeks';

alter table welders drop column if exists email;
alter table operators drop column if exists email;
