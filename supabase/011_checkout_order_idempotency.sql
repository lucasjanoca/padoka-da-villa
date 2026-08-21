-- PADOKA DA VILLA — idempotência do checkout do cliente
-- Aplicar SOMENTE no projeto Sites De Clientes! (yncspxfsvlqdnodlsosb)
-- Depende das migrations 001/002. Não cria trigger global em auth.users.

alter table public.padoka_orders
  add column if not exists request_id uuid;

create unique index if not exists padoka_orders_customer_request_uidx
  on public.padoka_orders(customer_id, request_id)
  where request_id is not null;

create or replace function public.padoka_create_order_once(
  p_request_id uuid,
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
  v_requested_items jsonb;
  v_existing_items jsonb;
  v_is_test boolean;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  if p_request_id is null then
    raise exception 'request id required';
  end if;
  if not exists(
    select 1
    from public.padoka_profiles p
    where p.id = auth.uid()
      and p.app_scope = 'padoka'
      and p.onboarding_completed
  ) then
    raise exception 'padoka onboarding required';
  end if;
  if p_pickup_mode not in ('store','night') then
    raise exception 'invalid pickup mode';
  end if;
  if p_pickup_date is null or p_pickup_time is null or nullif(trim(p_pickup_name),'') is null then
    raise exception 'pickup data required';
  end if;
  if char_length(trim(p_pickup_name)) > 80 then
    raise exception 'pickup name too long';
  end if;
  if p_pickup_date < (now() at time zone 'America/Sao_Paulo')::date then
    raise exception 'pickup date is in the past';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'order requires items';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'too many order lines';
  end if;

  with requested as (
    select x->>'product_id' as product_id,
           case when (x->>'quantity') ~ '^[0-9]+$' then (x->>'quantity')::integer else null end as quantity
    from jsonb_array_elements(p_items) x
  )
  select count(*),
         count(*) filter(
           where product_id ~ '^[a-z0-9][a-z0-9-]{0,63}$'
             and quantity between 1 and 50
         )
    into v_requested_count, v_valid_count
  from requested;

  if v_requested_count <> v_valid_count then
    raise exception 'invalid order item';
  end if;

  if exists (
    with requested as (
      select x->>'product_id' as product_id, (x->>'quantity')::integer as quantity
      from jsonb_array_elements(p_items) x
    ), grouped as (
      select product_id, sum(quantity)::integer as quantity
      from requested
      group by product_id
    )
    select 1 from grouped where quantity > 50
  ) then
    raise exception 'invalid order item quantity';
  end if;

  with requested as (
    select x->>'product_id' as product_id, (x->>'quantity')::integer as quantity
    from jsonb_array_elements(p_items) x
  ), grouped as (
    select product_id, sum(quantity)::integer as quantity
    from requested
    group by product_id
  ), priced as (
    select g.product_id, g.quantity, p.price, p.is_demo
    from grouped g
    join public.padoka_products p on p.id = g.product_id and p.active = true
  )
  select count(*),
         coalesce(round(sum(quantity * price),2),0),
         coalesce(bool_or(is_demo), true),
         coalesce(jsonb_agg(
           jsonb_build_object('product_id', product_id, 'quantity', quantity)
           order by product_id
         ), '[]'::jsonb)
    into v_valid_count, v_total, v_is_test, v_requested_items
  from priced;

  if v_valid_count <> (
    select count(distinct x->>'product_id')
    from jsonb_array_elements(p_items) x
  ) then
    raise exception 'unknown or inactive product';
  end if;
  if v_total <= 0 then
    raise exception 'invalid total';
  end if;

  v_code := 'PDK-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));

  insert into public.padoka_orders(
    code, customer_id, status, pickup_mode, pickup_date, pickup_time,
    pickup_name, total, payment_method, payment_status, is_test, request_id
  )
  values(
    v_code, auth.uid(), 'received', p_pickup_mode, p_pickup_date, p_pickup_time,
    trim(p_pickup_name), v_total, 'pix', 'not_configured', v_is_test, p_request_id
  )
  on conflict (customer_id, request_id) where request_id is not null do nothing
  returning * into v_order;

  if v_order.id is not null then
    with requested as (
      select x->>'product_id' as product_id, (x->>'quantity')::integer as quantity
      from jsonb_array_elements(p_items) x
    ), grouped as (
      select product_id, sum(quantity)::integer as quantity
      from requested
      group by product_id
    )
    insert into public.padoka_order_items(order_id, product_id, product_name, quantity, unit_price)
    select v_order.id, p.id, p.name, g.quantity, p.price
    from grouped g
    join public.padoka_products p on p.id = g.product_id and p.active = true;

    return v_order;
  end if;

  select *
    into v_order
  from public.padoka_orders
  where customer_id = auth.uid()
    and request_id = p_request_id;

  if v_order.id is null then
    raise exception 'request reconciliation failed';
  end if;

  select coalesce(jsonb_agg(
           jsonb_build_object('product_id', oi.product_id, 'quantity', oi.quantity)
           order by oi.product_id
         ), '[]'::jsonb)
    into v_existing_items
  from public.padoka_order_items oi
  where oi.order_id = v_order.id;

  if v_order.pickup_mode is distinct from p_pickup_mode
     or v_order.pickup_date is distinct from p_pickup_date
     or v_order.pickup_time is distinct from p_pickup_time
     or v_order.pickup_name is distinct from trim(p_pickup_name)
     or v_existing_items is distinct from v_requested_items then
    raise exception 'request id conflict';
  end if;

  return v_order;
end;
$$;

revoke all on function public.padoka_create_order_once(uuid,text,date,time without time zone,text,jsonb) from public, anon;
grant execute on function public.padoka_create_order_once(uuid,text,date,time without time zone,text,jsonb) to authenticated;
