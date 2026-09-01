-- Harden the privileged production completion implementation without changing its ACL.
-- The function body already schema-qualifies PADOKA tables and authorization helpers.
alter function padoka_private.padoka_record_production(uuid, numeric, uuid)
  set search_path = '';
