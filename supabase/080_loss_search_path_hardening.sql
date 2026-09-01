-- Harden the privileged idempotent loss registration implementation without changing its ACL.
-- The function body already schema-qualifies PADOKA tables and authorization helpers.
alter function padoka_private.padoka_register_loss_once(text, numeric, text, text, uuid)
  set search_path = '';
