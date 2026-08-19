-- PADOKA DA VILLA — catálogo demonstrativo autoritativo no servidor
-- Aplicado no projeto Sites De Clientes! (yncspxfsvlqdnodlsosb)
-- Os preços continuam demonstrativos até aprovação da padaria.

create table if not exists public.padoka_products (
  id text primary key,
  name text not null,
  category text not null,
  price numeric(12,2) not null check (price >= 0),
  active boolean not null default true,
  is_demo boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.padoka_products enable row level security;

drop policy if exists "padoka public active products" on public.padoka_products;
create policy "padoka public active products"
on public.padoka_products for select
to anon, authenticated
using (active = true);

grant select on public.padoka_products to anon, authenticated;

insert into public.padoka_products(id,name,category,price,active,is_demo,sort_order) values
('pao-frances','Pão Francês','paes',1.20,true,true,10),
('pao-queijo','Pão de Queijo','paes',4.50,true,true,20),
('croissant','Croissant','paes',8.90,true,true,30),
('croissant-recheado','Croissant Recheado','paes',11.90,true,true,40),
('coxinha','Coxinha','salgados',8.50,true,true,50),
('esfiha','Esfiha Assada','salgados',8.00,true,true,60),
('misto','Misto Quente','lanches',9.90,true,true,70),
('combo-noturno','Combo Noturno','lanches',19.90,true,true,80),
('bolo','Fatia de Bolo','doces',10.90,true,true,90),
('sonho','Sonho Recheado','doces',7.50,true,true,100),
('cookie','Cookie','doces',6.90,true,true,110),
('muffin','Muffin','doces',7.90,true,true,120),
('expresso','Café Expresso','bebidas',5.00,true,true,130),
('cappuccino','Cappuccino','bebidas',8.50,true,true,140),
('suco','Suco Natural','bebidas',9.00,true,true,150),
('agua','Água Mineral','bebidas',4.00,true,true,160)
on conflict (id) do update set
  name=excluded.name, category=excluded.category, price=excluded.price,
  active=excluded.active, is_demo=excluded.is_demo, sort_order=excluded.sort_order,
  updated_at=now();

create or replace function public.padoka_create_order(
  p_pickup_mode text,
  p_pickup_date date,
  p_pickup_time time without time zone,
  p_pickup_name text,
  p_items jsonb
) returns public.padoka_orders
language plpgsql
set search_path = public
as $$
declare
  v_order public.padoka_orders;
  v_total numeric(12,2);
  v_code text;
  v_requested_count integer;
  v_valid_count integer;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not exists(select 1 from public.padoka_profiles p where p.id=auth.uid() and p.app_scope='padoka' and p.onboarding_completed) then raise exception 'padoka onboarding required'; end if;
  if p_pickup_mode not in ('store','night') then raise exception 'invalid pickup mode'; end if;
  if p_pickup_date is null or p_pickup_time is null or nullif(trim(p_pickup_name),'') is null then raise exception 'pickup data required'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items)=0 then raise exception 'order requires items'; end if;
  if jsonb_array_length(p_items) > 50 then raise exception 'too many order lines'; end if;

  with requested as (
    select x->>'product_id' as product_id,
           case when (x->>'quantity') ~ '^[0-9]+$' then (x->>'quantity')::integer else null end as quantity
    from jsonb_array_elements(p_items) x
  )
  select count(*), count(*) filter(where product_id is not null and product_id <> '' and quantity between 1 and 50)
    into v_requested_count, v_valid_count
  from requested;
  if v_requested_count <> v_valid_count then raise exception 'invalid order item'; end if;

  with requested as (
    select x->>'product_id' as product_id, (x->>'quantity')::integer as quantity
    from jsonb_array_elements(p_items) x
  ), grouped as (
    select product_id, sum(quantity)::integer as quantity from requested group by product_id
  ), priced as (
    select g.product_id, g.quantity, p.price
    from grouped g join public.padoka_products p on p.id=g.product_id and p.active=true
  )
  select count(*), coalesce(round(sum(quantity * price),2),0)
    into v_valid_count, v_total
  from priced;

  if v_valid_count <> (select count(distinct x->>'product_id') from jsonb_array_elements(p_items) x) then raise exception 'unknown or inactive product'; end if;
  if v_total <= 0 then raise exception 'invalid total'; end if;

  v_code := 'PDK-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
  insert into public.padoka_orders(code,customer_id,status,pickup_mode,pickup_date,pickup_time,pickup_name,total,payment_method,payment_status,is_test)
  values(v_code,auth.uid(),'received',p_pickup_mode,p_pickup_date,p_pickup_time,trim(p_pickup_name),v_total,'pix','not_configured',true)
  returning * into v_order;

  with requested as (
    select x->>'product_id' as product_id, (x->>'quantity')::integer as quantity
    from jsonb_array_elements(p_items) x
  ), grouped as (
    select product_id, sum(quantity)::integer as quantity from requested group by product_id
  )
  insert into public.padoka_order_items(order_id,product_id,product_name,quantity,unit_price)
  select v_order.id, p.id, p.name, g.quantity, p.price
  from grouped g join public.padoka_products p on p.id=g.product_id and p.active=true;

  return v_order;
end;
$$;

revoke all on function public.padoka_create_order(text,date,time without time zone,text,jsonb) from public, anon;
grant execute on function public.padoka_create_order(text,date,time without time zone,text,jsonb) to authenticated;
