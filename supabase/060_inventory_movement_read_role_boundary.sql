-- PADOKA DA VILLA — menor privilégio na leitura do histórico de estoque
-- Backend correto: Sites De Clientes! (yncspxfsvlqdnodlsosb).
-- NÃO aplicar em InfoTech.io e não alterar objetos de outros sistemas.
--
-- padoka_inventory_movements não é consumida pelo frontend público nem pelo
-- runtime operacional atual. A leitura direta fica restrita aos papéis que
-- administram estoque, mantendo gravações exclusivamente nas RPCs autoritativas.

alter table public.padoka_inventory_movements enable row level security;

drop policy if exists "padoka staff read inventory movements"
  on public.padoka_inventory_movements;

create policy "padoka stock roles read inventory movements"
on public.padoka_inventory_movements
for select
to authenticated
using (
  (select public.padoka_staff_has_role(array['owner','manager','stock']))
);

-- Mantém a superfície mínima existente: navegador autenticado só possui SELECT;
-- anon continua sem qualquer privilégio sobre a tabela.
revoke all on public.padoka_inventory_movements from anon;
revoke insert, update, delete, truncate, references, trigger
  on public.padoka_inventory_movements from authenticated;
grant select on public.padoka_inventory_movements to authenticated;
