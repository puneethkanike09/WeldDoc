create index if not exists notif_oq_idx
  on notification_log (operator_qualification_id, alert_type, expiry_date);
