-- Harden the privileged internal reporting summary without changing its ACL or output.
-- The active function body already schema-qualifies PADOKA tables and the authorization helper.
alter function padoka_private.padoka_report_summary(date, date)
  set search_path = '';
