-- PADOKA DA VILLA — registro transacional de produção
-- Backend alvo exclusivo: Sites De Clientes! (yncspxfsvlqdnodlsosb)
-- NÃO aplicar no projeto InfoTech.io.
-- Depende da migration 003 e mantém todos os objetos isolados por prefixo padoka_.

create table if not exists public.padoka_production_batches (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  plan_id uuid not null references public.padoka_production_plans(id) on delete restrict,
  product_id text not null references public.padoka_products(id) on delete restrict,
  quantity numeric(12,3) not null check (quantity > 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.padoka_production_batches enable row level security;

drop policy if exists "padoka staff read production batches" on public.padoka_production_batches;
create policy "padoka staff read production batches"
on public.padoka_production_batches
for select to authenticated
using (public.padoka_is_staff());

revoke all on public.padoka_production_batches from anon, authenticated;
grant select on public.padoka_production_batches to authenticated;

create or replace function public.padoka_record_production(
  p_plan_id uuid,
  p_quantity numeric,
  p_request_id uuid
) returns public.padoka_production_batches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan public.padoka_production_plans;
  v_batch public.padoka_production_batches;
  v_new_produced numeric(12,3);
begin
  if not public.padoka_staff_has_role(array['owner','manager','production']) then
    raise exception 'padoka production permission required';
  end if;
  if p_plan_id is null then raise exception 'production plan required'; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'production quantity must be positive'; end if;
  if p_request_id is null then raise exception 'production request id required'; end if;

  -- Idempotência: repetir exatamente a mesma requisição devolve o lote já criado.
  -- Reutilizar o mesmo request_id com plano ou quantidade diferentes é conflito,
  -- nunca uma confirmação silenciosa de uma operação diferente.
  select * into v_batch
  from public.padoka_production_batches
  where request_id = p_request_id;
  if v_batch.id is not null then
    if v_batch.plan_id is distinct from p_plan_id or v_batch.quantity is distinct from p_quantity then
      raise exception 'production request id conflict';
    end if;
    return v_batch;
  end if;

  select * into v_plan
  from public.padoka_production_plans
  where id = p_plan_id
  for update;

  if v_plan.id is null then raise exception 'production plan not found'; end if;

  -- Revalida após adquirir o lock do plano. Duas requisições simultâneas com
  -- o mesmo request_id não conseguem duplicar estoque nem quantidade produzida.
  select * into v_batch
  from public.padoka_production_batches
  where request_id = p_request_id;
  if v_batch.id is not null then
    if v_batch.plan_id is distinct from p_plan_id or v_batch.quantity is distinct from p_quantity then
      raise exception 'production request id conflict';
    end if;
    return v_batch;
  end if;

  if v_plan.status = 'cancelled' then raise exception 'production plan is cancelled'; end if;
  if v_plan.status = 'completed' then raise exception 'production plan is already completed'; end if;
  if not exists(select 1 from public.padoka_products p where p.id = v_plan.product_id and p.active = true) then
    raise exception 'unknown or inactive product';
  end if;

  v_new_produced := v_plan.produced_quantity + p_quantity;

  insert into public.padoka_inventory(product_id,quantity,updated_by,updated_at)
  values(v_plan.product_id,p_quantity,auth.uid(),now())
  on conflict (product_id) do update
  set quantity = public.padoka_inventory.quantity + excluded.quantity,
      updated_by = auth.uid(),
      updated_at = now();

  update public.padoka_production_plans
  set produced_quantity = v_new_produced,
      status = case
        when planned_quantity > 0 and v_new_produced >= planned_quantity then 'completed'
        else 'in_progress'
      end
  where id = v_plan.id;

  insert into public.padoka_production_batches(request_id,plan_id,product_id,quantity,created_by)
  values(p_request_id,v_plan.id,v_plan.product_id,p_quantity,auth.uid())
  returning * into v_batch;

  insert into public.padoka_inventory_movements(product_id,delta,reason,source,reference_id,created_by)
  values(v_plan.product_id,p_quantity,'Produção registrada','production',v_batch.id,auth.uid());

  return v_batch;
end;
$$;

revoke all on function public.padoka_record_production(uuid,numeric,uuid) from public, anon;
grant execute on function public.padoka_record_production(uuid,numeric,uuid) to authenticated;

create index if not exists padoka_production_batches_plan_created_idx
on public.padoka_production_batches(plan_id,created_at desc);

create index if not exists padoka_production_batches_product_created_idx
on public.padoka_production_batches(product_id,created_at desc);
