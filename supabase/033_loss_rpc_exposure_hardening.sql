-- PADOKA DA VILLA
-- Backend correto: Sites De Clientes! (yncspxfsvlqdnodlsosb)
-- NÃO aplicar no projeto InfoTech.io.

begin;

-- O frontend usa exclusivamente a variante idempotente com request_id.
-- A RPC legada permanece disponível apenas para execução privilegiada de backend.
revoke execute on function public.padoka_register_loss(text, numeric, text, text) from public, anon, authenticated;
grant execute on function public.padoka_register_loss(text, numeric, text, text) to service_role;

-- Mantém a RPC idempotente disponível somente para usuários autenticados e backend.
revoke execute on function public.padoka_register_loss_once(text, numeric, text, text, uuid) from public, anon;
grant execute on function public.padoka_register_loss_once(text, numeric, text, text, uuid) to authenticated, service_role;

commit;
