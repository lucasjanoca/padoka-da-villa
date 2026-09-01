-- Harden the privileged idempotent PDV sale implementation without changing its ACL.
-- The function body already schema-qualifies PADOKA tables and authorization helpers.
alter function padoka_private.padoka_create_sale_once(jsonb, text, uuid)
  set search_path = '';
