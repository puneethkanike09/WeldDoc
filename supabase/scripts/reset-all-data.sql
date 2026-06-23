-- Full WeldDoc data reset (schema, RLS, functions, and migration 0008 trigger are kept).
-- Removes all welders, qualifications, reports, orgs, profiles, and auth users.

begin;

truncate table
  notification_log,
  validation_records,
  ndt_dt_records,
  ranges_of_approval,
  qualification_records,
  qualification_test_reports,
  welders
restart identity cascade;

delete from public.profiles;
delete from public.organizations;
delete from auth.users;

commit;
