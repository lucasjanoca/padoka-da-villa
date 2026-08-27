-- PADOKA DA VILLA — encerra o ajuste manual legado sem idempotência
-- Aplicar somente depois que o frontend usando padoka_adjust_inventory_once estiver publicado.

revoke all on function public.padoka_adjust_inventory(text, numeric, text, text, uuid) from public;
revoke all on function public.padoka_adjust_inventory(text, numeric, text, text, uuid) from anon;
revoke all on function public.padoka_adjust_inventory(text, numeric, text, text, uuid) from authenticated;
grant execute on function public.padoka_adjust_inventory(text, numeric, text, text, uuid) to service_role;
