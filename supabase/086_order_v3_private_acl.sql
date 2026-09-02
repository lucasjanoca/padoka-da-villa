-- PADOKA DA VILLA — privilégio mínimo da implementação privada do checkout
-- O frontend chama somente o wrapper public.padoka_create_order_once_v3.
-- A implementação SECURITY DEFINER permanece acessível apenas ao papel authenticated,
-- necessário para o wrapper SECURITY INVOKER, sem EXECUTE herdado por PUBLIC/anon.

revoke execute on function padoka_private.padoka_create_order_once_v3(
  uuid,
  text,
  date,
  time without time zone,
  text,
  jsonb,
  text,
  text
) from public;

revoke execute on function padoka_private.padoka_create_order_once_v3(
  uuid,
  text,
  date,
  time without time zone,
  text,
  jsonb,
  text,
  text
) from anon;

grant execute on function padoka_private.padoka_create_order_once_v3(
  uuid,
  text,
  date,
  time without time zone,
  text,
  jsonb,
  text,
  text
) to authenticated;
