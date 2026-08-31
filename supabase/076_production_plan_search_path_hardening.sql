-- Harden the privileged production-plan implementation without changing its ACL.
-- The function body already schema-qualifies PADOKA objects and authorization helpers.
alter function padoka_private.padoka_upsert_production_plan(date, text, numeric, text)
  set search_path = '';
