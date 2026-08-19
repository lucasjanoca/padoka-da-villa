-- PADOKA DA VILLA — vendas de balcão / PDV com baixa transacional de estoque
-- Backend alvo exclusivo: Sites De Clientes! (yncspxfsvlqdnodlsosb)
-- NÃO aplicar no projeto InfoTech.io.
-- DEPENDE de 003_operational_inventory_production_losses.sql já aplicada.
-- Não cria trigger em auth.users e mantém todos os objetos exclusivos com prefixo padoka_.

create table if not exists public.padoka_sales (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  cashier_user_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'completed' check (status in ('completed','voided')),
  payment_method text not null check (payment_method in ('cash','pix','debit','credit','other')),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  total numeric(12,2) not null check (total >= 0),
  is_test boolean not null default true,
  voided_by uuid references auth.users(id) on delete set null,
  voided_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.padoka_sale_items (
  id bigint generated always as identity primary key,
  sale_id uuid not null references public.padoka_sales(id) on delete restrict,
  product_id text not null references public.padoka_products(id) on delete restrict,
  product_name text not null,
  quantity numeric(12,3) not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create or replace function public.padoka_create_sale(
  p_items jsonb,
  p_payment_method text
) returns public.padoka_sales
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale public.padoka_sales;
  v_code text;
  v_total numeric(12,2);
  v_requested_count integer;
  v_valid_count integer;
  v_demo boolean;
  r record;
begin
  if not public.padoka_staff_has_role(array['owner','manager','cashier','attendant']) then
    raise exception 'padoka pdv permission required';
  end if;

  if p_payment_method not in ('cash','pix','debit','credit','other') then
    raise exception 'invalid payment method';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'sale requires items';
  end if;
  if jsonb_array_length(p_items) > 100 then raise exception 'too many sale lines'; end if;

  with requested as (
    select
      nullif(trim(x->>'product_id'),'') as product_id,
      case
        when (x->>'quantity') ~ '^[0-9]+([.][0-9]{1,3})?$' then (x->>'quantity')::numeric
        else null
      end as quantity
    from jsonb_array_elements(p_items) x
  )
  select count(*), count(*) filter (
    where product_id is not null and quantity is not null and quantity > 0 and quantity <= 9999
  )
  into v_requested_count, v_valid_count
  from requested;

  if v_requested_count <> v_valid_count then raise exception 'invalid sale item'; end if;

  with requested as (
    select (x->>'product_id')::text as product_id, (x->>'quantity')::numeric as quantity
    from jsonb_array_elements(p_items) x
  ), grouped as (
    select product_id, sum(quantity)::numeric(12,3) as quantity
    from requested
    group by product_id
  ), priced as (
    select g.product_id, g.quantity, p.price, p.is_demo
    from grouped g
    join public.padoka_products p on p.id = g.product_id and p.active = true
  )
  select
    count(*),
    coalesce(round(sum(quantity * price),2),0),
    coalesce(bool_or(is_demo),true)
  into v_valid_count, v_total, v_demo
  from priced;

  if v_valid_count <> (
    select count(distinct x->>'product_id') from jsonb_array_elements(p_items) x
  ) then
    raise exception 'unknown or inactive product';
  end if;
  if v_total <= 0 then raise exception 'invalid sale total'; end if;

  -- Trava as linhas de estoque em ordem estável para reduzir risco de deadlock.
  for r in
    with requested as (
      select (x->>'product_id')::text as product_id, (x->>'quantity')::numeric as quantity
      from jsonb_array_elements(p_items) x
    ), grouped as (
      select product_id, sum(quantity)::numeric(12,3) as quantity
      from requested
      group by product_id
    )
    select i.product_id, i.quantity as available, g.quantity as requested
    from grouped g
    join public.padoka_inventory i on i.product_id = g.product_id
    order by i.product_id
    for update of i
  loop
    if r.available < r.requested then
      raise exception 'insufficient inventory for product %', r.product_id;
    end if;
  end loop;

  if (
    with requested as (
      select distinct x->>'product_id' as product_id from jsonb_array_elements(p_items) x
    )
    select count(*) from requested
  ) <> (
    with requested as (
      select distinct x->>'product_id' as product_id from jsonb_array_elements(p_items) x
    )
    select count(*) from requested r join public.padoka_inventory i on i.product_id = r.product_id
  ) then
    raise exception 'inventory not initialized for all products';
  end if;

  v_code := 'PDV-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));

  insert into public.padoka_sales(code,cashier_user_id,payment_method,subtotal,total,is_test)
  values(v_code,auth.uid(),p_payment_method,v_total,v_total,v_demo)
  returning * into v_sale;

  with requested as (
    select (x->>'product_id')::text as product_id, (x->>'quantity')::numeric as quantity
    from jsonb_array_elements(p_items) x
  ), grouped as (
    select product_id, sum(quantity)::numeric(12,3) as quantity
    from requested
    group by product_id
  )
  insert into public.padoka_sale_items(sale_id,product_id,product_name,quantity,unit_price,line_total)
  select v_sale.id,p.id,p.name,g.quantity,p.price,round(g.quantity * p.price,2)
  from grouped g
  join public.padoka_products p on p.id = g.product_id and p.active = true;

  with requested as (
    select (x->>'product_id')::text as product_id, (x->>'quantity')::numeric as quantity
    from jsonb_array_elements(p_items) x
  ), grouped as (
    select product_id, sum(quantity)::numeric(12,3) as quantity
    from requested
    group by product_id
  )
  update public.padoka_inventory i
  set quantity = i.quantity - g.quantity,
      updated_by = auth.uid(),
      updated_at = now()
  from grouped g
  where i.product_id = g.product_id;

  insert into public.padoka_inventory_movements(product_id,delta,reason,source,reference_id,created_by)
  select si.product_id,-si.quantity,'Venda de balcão ' || v_sale.code,'sale',v_sale.id,auth.uid()
  from public.padoka_sale_items si
  where si.sale_id = v_sale.id;

  return v_sale;
end;
$$;

alter table public.padoka_sales enable row level security;
alter table public.padoka_sale_items enable row level security;

drop policy if exists "padoka staff read sales" on public.padoka_sales;
create policy "padoka staff read sales" on public.padoka_sales
for select to authenticated using (public.padoka_is_staff());

drop policy if exists "padoka staff read sale items" on public.padoka_sale_items;
create policy "padoka staff read sale items" on public.padoka_sale_items
for select to authenticated
using (
  exists (
    select 1 from public.padoka_sales s
    where s.id = sale_id and public.padoka_is_staff()
  )
);

revoke all on public.padoka_sales from anon;
revoke all on public.padoka_sale_items from anon;
grant select on public.padoka_sales to authenticated;
grant select on public.padoka_sale_items to authenticated;

revoke all on function public.padoka_create_sale(jsonb,text) from public, anon;
grant execute on function public.padoka_create_sale(jsonb,text) to authenticated;

create index if not exists padoka_sales_created_idx on public.padoka_sales(created_at desc);
create index if not exists padoka_sales_cashier_created_idx on public.padoka_sales(cashier_user_id,created_at desc);
create index if not exists padoka_sale_items_sale_idx on public.padoka_sale_items(sale_id);
