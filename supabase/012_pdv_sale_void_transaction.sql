-- PADOKA DA VILLA — estorno transacional de venda do Caixa / PDV
-- Backend alvo exclusivo: Sites De Clientes! (yncspxfsvlqdnodlsosb)
-- NÃO aplicar no projeto InfoTech.io.
-- DEPENDE das migrations 003 e 004.
-- Não cria trigger em auth.users e mantém todos os objetos exclusivos com prefixo padoka_.

alter table public.padoka_sales
  add column if not exists void_reason text;

create or replace function public.padoka_void_sale(
  p_sale_id uuid,
  p_reason text
) returns public.padoka_sales
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale public.padoka_sales;
  v_reason text;
  v_expected_products integer;
  v_inventory_products integer;
  r record;
begin
  if not public.padoka_staff_has_role(array['owner','manager']) then
    raise exception 'padoka sale void permission required';
  end if;

  if p_sale_id is null then
    raise exception 'sale id required';
  end if;

  v_reason := trim(coalesce(p_reason,''));
  if char_length(v_reason) not between 3 and 160 then
    raise exception 'invalid sale void reason';
  end if;

  select *
    into v_sale
  from public.padoka_sales
  where id = p_sale_id
  for update;

  if not found then
    raise exception 'sale not found';
  end if;

  -- Retry seguro: uma venda já estornada não devolve estoque novamente.
  if v_sale.status = 'voided' then
    return v_sale;
  end if;

  if v_sale.status <> 'completed' then
    raise exception 'sale cannot be voided';
  end if;

  select count(distinct si.product_id)
    into v_expected_products
  from public.padoka_sale_items si
  where si.sale_id = v_sale.id;

  if coalesce(v_expected_products,0) = 0 then
    raise exception 'sale has no items';
  end if;

  -- Trava as linhas de estoque em ordem estável antes de devolver qualquer quantidade.
  for r in
    with grouped as (
      select si.product_id, sum(si.quantity)::numeric(12,3) as quantity
      from public.padoka_sale_items si
      where si.sale_id = v_sale.id
      group by si.product_id
    )
    select i.product_id, g.quantity
    from grouped g
    join public.padoka_inventory i on i.product_id = g.product_id
    order by i.product_id
    for update of i
  loop
    null;
  end loop;

  with grouped as (
    select si.product_id
    from public.padoka_sale_items si
    where si.sale_id = v_sale.id
    group by si.product_id
  )
  select count(*)
    into v_inventory_products
  from grouped g
  join public.padoka_inventory i on i.product_id = g.product_id;

  if v_inventory_products <> v_expected_products then
    raise exception 'inventory not initialized for all sale items';
  end if;

  with grouped as (
    select si.product_id, sum(si.quantity)::numeric(12,3) as quantity
    from public.padoka_sale_items si
    where si.sale_id = v_sale.id
    group by si.product_id
  )
  update public.padoka_inventory i
  set quantity = i.quantity + g.quantity,
      updated_by = auth.uid(),
      updated_at = now()
  from grouped g
  where i.product_id = g.product_id;

  insert into public.padoka_inventory_movements(
    product_id,delta,reason,source,reference_id,created_by
  )
  select
    si.product_id,
    sum(si.quantity)::numeric(12,3),
    left('Estorno venda ' || v_sale.code || ': ' || v_reason,120),
    'sale',
    v_sale.id,
    auth.uid()
  from public.padoka_sale_items si
  where si.sale_id = v_sale.id
  group by si.product_id;

  update public.padoka_sales
  set status = 'voided',
      voided_by = auth.uid(),
      voided_at = now(),
      void_reason = v_reason
  where id = v_sale.id
  returning * into v_sale;

  return v_sale;
end;
$$;

revoke all on function public.padoka_void_sale(uuid,text) from public, anon;
grant execute on function public.padoka_void_sale(uuid,text) to authenticated;

-- Não conceder UPDATE direto em padoka_sales. O estorno deve passar exclusivamente
-- pela RPC acima para manter devolução de estoque e auditoria na mesma transação.
