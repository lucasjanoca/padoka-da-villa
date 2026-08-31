-- PADOKA DA VILLA — menor privilégio nas leituras de produção e perdas
-- Backend correto: Sites De Clientes! (yncspxfsvlqdnodlsosb).
-- NÃO aplicar em InfoTech.io e não alterar objetos de outros sistemas.
--
-- O runtime operacional já carrega somente a fonte necessária por módulo.
-- Relatórios são exclusivos de owner/manager e continuam cobertos pelas duas policies.
-- Estoque permanece inalterado nesta migration porque o PDV ainda consulta
-- padoka_inventory para códigos de barras antes de o RPC dedicado assumir.

alter table public.padoka_production_plans enable row level security;
alter table public.padoka_losses enable row level security;

drop policy if exists "padoka staff read production"
  on public.padoka_production_plans;

create policy "padoka production roles read production"
on public.padoka_production_plans
for select
to authenticated
using (
  (select public.padoka_staff_has_role(array['owner','manager','production']))
);

drop policy if exists "padoka staff read losses"
  on public.padoka_losses;

create policy "padoka loss roles read losses"
on public.padoka_losses
for select
to authenticated
using (
  (select public.padoka_staff_has_role(array['owner','manager','stock','production']))
);

-- Data API: mantém somente SELECT direto para authenticated; mutações seguem
-- RPCs server-authoritative. anon não possui qualquer privilégio nessas tabelas.
revoke all on public.padoka_production_plans, public.padoka_losses from anon;
revoke insert, update, delete, truncate, references, trigger
  on public.padoka_production_plans, public.padoka_losses from authenticated;
grant select on public.padoka_production_plans, public.padoka_losses to authenticated;
