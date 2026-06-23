-- Clear all welder / qualification data. Keeps auth users, orgs, and profiles.

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

-- Reset per-org welder/report sequences (UID allocation counters).
update organizations
set welder_seq = 0, wpq_seq = 100;

commit;
