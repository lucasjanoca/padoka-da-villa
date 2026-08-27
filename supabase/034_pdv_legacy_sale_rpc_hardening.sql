-- PADOKA DA VILLA — encerra exposição da RPC legada de venda do PDV
-- Backend alvo exclusivo: Sites De Clientes! (yncspxfsvlqdnodlsosb)
-- NÃO aplicar no projeto InfoTech.io.
-- DEPENDE de 010_pdv_sale_idempotency.sql e do frontend usando padoka_create_sale_once.
-- Não cria trigger em auth.users e não altera objetos fora do namespace padoka_.

-- A venda autoritativa e idempotente permanece em padoka_create_sale_once(jsonb,text,uuid).
-- A função antiga não possui request_id; mantê-la executável por authenticated permitiria
-- uma segunda baixa de estoque após resposta de rede ambígua no cliente.
revoke all on function public.padoka_create_sale(jsonb,text) from public, anon, authenticated;
