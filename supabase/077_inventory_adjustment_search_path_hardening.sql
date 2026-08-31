-- Harden the privileged idempotent inventory-adjustment implementation without changing its ACL.
-- The function body already schema-qualifies PADOKA tables and authorization helpers.
alter function padoka_private.padoka_adjust_inventory_once(text, numeric, text, uuid)
  set search_path = '';
