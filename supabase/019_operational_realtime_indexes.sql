-- PADOKA DA VILLA — follow-up operacional: Realtime e índices de apoio
-- Backend alvo exclusivo: Sites De Clientes! (yncspxfsvlqdnodlsosb)
-- NÃO aplicar no projeto InfoTech.io.
-- Depende somente da migration 003 e pode ser aplicada com segurança antes das migrations 004→018.

create index if not exists padoka_inventory_updated_by_idx
  on public.padoka_inventory(updated_by)
  where updated_by is not null;

create index if not exists padoka_inventory_movements_created_by_idx
  on public.padoka_inventory_movements(created_by)
  where created_by is not null;

create index if not exists padoka_losses_product_idx
  on public.padoka_losses(product_id);

create index if not exists padoka_losses_created_by_idx
  on public.padoka_losses(created_by)
  where created_by is not null;

create index if not exists padoka_production_plans_product_idx
  on public.padoka_production_plans(product_id);

create index if not exists padoka_production_plans_created_by_idx
  on public.padoka_production_plans(created_by)
  where created_by is not null;

create index if not exists padoka_production_plans_updated_by_idx
  on public.padoka_production_plans(updated_by)
  where updated_by is not null;

-- A camada assets/operational-sync.js já escuta estas tabelas por postgres_changes.
-- Adicionamos somente objetos PADOKA à publicação padrão do Supabase Realtime.
do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'padoka_inventory',
    'padoka_inventory_movements',
    'padoka_production_plans',
    'padoka_losses'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = v_table
    ) then
      execute format('alter publication supabase_realtime add table public.%I', v_table);
    end if;
  end loop;
end;
$$;
