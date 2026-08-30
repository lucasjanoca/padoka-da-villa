-- PADOKA DA VILLA — cupons server-authoritative e checkout v2 compatível

alter table public.padoka_orders add column if not exists subtotal numeric(12,2);
alter table public.padoka_orders add column if not exists discount_total numeric(12,2);
alter table public.padoka_orders add column if not exists coupon_code text;

update public.padoka_orders
set subtotal=coalesce(subtotal,total),
    discount_total=coalesce(discount_total,0)
where subtotal is null or discount_total is null;

alter table public.padoka_orders alter column subtotal set default 0;
alter table public.padoka_orders alter column subtotal set not null;
alter table public.padoka_orders alter column discount_total set default 0;
alter table public.padoka_orders alter column discount_total set not null;
alter table public.padoka_orders
  drop constraint if exists padoka_orders_discount_nonnegative_check;
alter table public.padoka_orders
  add constraint padoka_orders_discount_nonnegative_check
  check (subtotal>=0 and discount_total>=0 and discount_total<=subtotal and total=subtotal-discount_total);
alter table public.padoka_orders
  drop constraint if exists padoka_orders_coupon_code_check;
alter table public.padoka_orders
  add constraint padoka_orders_coupon_code_check
  check (coupon_code is null or coupon_code ~ '^[A-Z0-9][A-Z0-9_-]{2,31}$');

create table if not exists public.padoka_coupons (
  code text primary key check (code ~ '^[A-Z0-9][A-Z0-9_-]{2,31}$'),
  description text not null default '' check (char_length(description)<=180),
  discount_type text not null check (discount_type in ('percent','fixed')),
  discount_value numeric(12,2) not null check (discount_value>0),
  min_order numeric(12,2) not null default 0 check (min_order>=0),
  max_discount numeric(12,2) null check (max_discount is null or max_discount>0),
  starts_at timestamptz null,
  ends_at timestamptz null,
  max_redemptions integer null check (max_redemptions is null or max_redemptions>0),
  max_per_user integer not null default 1 check (max_per_user between 1 and 100),
  active boolean not null default true,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at>starts_at),
  check (
    (discount_type='percent' and discount_value<=100)
    or discount_type='fixed'
  )
);

alter table public.padoka_coupons enable row level security;
revoke all on table public.padoka_coupons from public,anon,authenticated;
grant select on table public.padoka_coupons to authenticated;

drop policy if exists padoka_coupons_staff_read on public.padoka_coupons;
create policy padoka_coupons_staff_read on public.padoka_coupons
for select to authenticated
using (padoka_private.staff_has_role(array['owner','manager']));

create or replace function padoka_private.padoka_calculate_coupon(
  p_code text,
  p_customer_id uuid,
  p_subtotal numeric
)
returns numeric
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_coupon public.padoka_coupons;
  v_code text:=upper(trim(coalesce(p_code,'')));
  v_discount numeric(12,2):=0;
  v_total_uses integer:=0;
  v_user_uses integer:=0;
begin
  if v_code='' then return 0; end if;
  if p_customer_id is null or p_customer_id is distinct from auth.uid() then raise exception 'invalid customer'; end if;
  if p_subtotal is null or p_subtotal<=0 then raise exception 'invalid subtotal'; end if;
  if not coalesce((select f.enabled from public.padoka_feature_flags f where f.key='coupons'),false) then
    raise exception 'coupons disabled';
  end if;

  select * into v_coupon from public.padoka_coupons c where c.code=v_code and c.active;
  if v_coupon.code is null then raise exception 'coupon unavailable'; end if;
  if v_coupon.starts_at is not null and now()<v_coupon.starts_at then raise exception 'coupon not started'; end if;
  if v_coupon.ends_at is not null and now()>v_coupon.ends_at then raise exception 'coupon expired'; end if;
  if p_subtotal<v_coupon.min_order then raise exception 'minimum order not reached'; end if;

  select count(*) into v_total_uses
  from public.padoka_orders o
  where o.coupon_code=v_code and o.status<>'cancelled';

  select count(*) into v_user_uses
  from public.padoka_orders o
  where o.coupon_code=v_code and o.customer_id=p_customer_id and o.status<>'cancelled';

  if v_coupon.max_redemptions is not null and v_total_uses>=v_coupon.max_redemptions then raise exception 'coupon limit reached'; end if;
  if v_user_uses>=v_coupon.max_per_user then raise exception 'coupon user limit reached'; end if;

  if v_coupon.discount_type='percent' then
    v_discount:=round(p_subtotal*(v_coupon.discount_value/100),2);
  else
    v_discount:=least(p_subtotal,v_coupon.discount_value);
  end if;
  if v_coupon.max_discount is not null then v_discount:=least(v_discount,v_coupon.max_discount); end if;
  return greatest(0,least(p_subtotal,round(v_discount,2)));
end;
$$;
revoke all on function padoka_private.padoka_calculate_coupon(text,uuid,numeric) from public,anon;
grant execute on function padoka_private.padoka_calculate_coupon(text,uuid,numeric) to authenticated,service_role;

create or replace function public.padoka_coupon_preview(p_code text,p_items jsonb)
returns jsonb
language plpgsql
security invoker
set search_path=''
as $$
declare
  v_subtotal numeric(12,2);
  v_discount numeric(12,2);
  v_count integer;
  v_code text:=upper(trim(coalesce(p_code,'')));
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if v_code !~ '^[A-Z0-9][A-Z0-9_-]{2,31}$' then raise exception 'invalid coupon code'; end if;
  if p_items is null or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 or jsonb_array_length(p_items)>50 then raise exception 'invalid items'; end if;

  with requested as (
    select x->>'product_id' product_id,
      case when (x->>'quantity') ~ '^[0-9]+$' then (x->>'quantity')::integer else null end quantity
    from jsonb_array_elements(p_items) x
  ), grouped as (
    select product_id,sum(quantity)::integer quantity from requested
    where product_id ~ '^[a-z0-9][a-z0-9-]{0,63}$' and quantity between 1 and 50
    group by product_id
  ), priced as (
    select g.product_id,g.quantity,p.price,p.is_demo
    from grouped g join public.padoka_products p on p.id=g.product_id and p.active
  )
  select count(*),coalesce(round(sum(quantity*price),2),0)
  into v_count,v_subtotal from priced;

  if v_count<>(select count(distinct x->>'product_id') from jsonb_array_elements(p_items) x) then raise exception 'invalid or inactive item'; end if;
  if exists(
    select 1 from public.padoka_products p
    join (select distinct x->>'product_id' id from jsonb_array_elements(p_items) x) r on r.id=p.id
    where p.is_demo
  ) then raise exception 'coupons unavailable for demo catalog'; end if;

  v_discount:=padoka_private.padoka_calculate_coupon(v_code,auth.uid(),v_subtotal);
  return jsonb_build_object('code',v_code,'subtotal',v_subtotal,'discount',v_discount,'total',v_subtotal-v_discount);
end;
$$;
revoke all on function public.padoka_coupon_preview(text,jsonb) from public,anon;
grant execute on function public.padoka_coupon_preview(text,jsonb) to authenticated,service_role;

create or replace function padoka_private.padoka_create_order_once_v2(
  p_request_id uuid,
  p_pickup_mode text,
  p_pickup_date date,
  p_pickup_time time without time zone,
  p_pickup_name text,
  p_items jsonb,
  p_coupon_code text default null
)
returns public.padoka_orders
language plpgsql
security definer
set search_path=''
as $$
declare
  v_order public.padoka_orders;
  v_subtotal numeric(12,2);
  v_discount numeric(12,2):=0;
  v_total numeric(12,2);
  v_code text;
  v_requested_count integer;
  v_valid_count integer;
  v_requested_items jsonb;
  v_existing_items jsonb;
  v_is_test boolean;
  v_payment_enabled boolean:=false;
  v_coupon_code text:=nullif(upper(trim(coalesce(p_coupon_code,''))),'');
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if p_request_id is null then raise exception 'request id required'; end if;
  if not exists(select 1 from public.padoka_profiles p where p.id=auth.uid() and p.app_scope='padoka' and p.onboarding_completed) then raise exception 'padoka onboarding required'; end if;
  if p_pickup_mode not in ('store','night') then raise exception 'invalid pickup mode'; end if;
  if p_pickup_date is null or p_pickup_time is null or nullif(trim(p_pickup_name),'') is null then raise exception 'pickup data required'; end if;
  if char_length(trim(p_pickup_name))>80 then raise exception 'pickup name too long'; end if;
  if p_pickup_date<(now() at time zone 'America/Sao_Paulo')::date then raise exception 'pickup date is in the past'; end if;
  if (p_pickup_date+p_pickup_time)<(now() at time zone 'America/Sao_Paulo') then raise exception 'pickup time is in the past'; end if;
  if p_items is null or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'order requires items'; end if;
  if jsonb_array_length(p_items)>50 then raise exception 'too many order lines'; end if;
  if v_coupon_code is not null and v_coupon_code !~ '^[A-Z0-9][A-Z0-9_-]{2,31}$' then raise exception 'invalid coupon code'; end if;

  with requested as (
    select x->>'product_id' product_id,
      case when (x->>'quantity') ~ '^[0-9]+$' then (x->>'quantity')::integer else null end quantity
    from jsonb_array_elements(p_items) x
  )
  select count(*),count(*) filter(where product_id ~ '^[a-z0-9][a-z0-9-]{0,63}$' and quantity between 1 and 50)
  into v_requested_count,v_valid_count from requested;
  if v_requested_count<>v_valid_count then raise exception 'invalid order item'; end if;

  if exists(with requested as (
      select x->>'product_id' product_id,(x->>'quantity')::integer quantity from jsonb_array_elements(p_items) x
    ), grouped as (select product_id,sum(quantity)::integer quantity from requested group by product_id)
    select 1 from grouped where quantity>50) then raise exception 'invalid order item quantity'; end if;

  with requested as (
    select x->>'product_id' product_id,(x->>'quantity')::integer quantity from jsonb_array_elements(p_items) x
  ), grouped as (
    select product_id,sum(quantity)::integer quantity from requested group by product_id
  ), priced as (
    select g.product_id,g.quantity,p.price,p.is_demo from grouped g join public.padoka_products p on p.id=g.product_id and p.active
  )
  select count(*),coalesce(round(sum(quantity*price),2),0),coalesce(bool_or(is_demo),true),
    coalesce(jsonb_agg(jsonb_build_object('product_id',product_id,'quantity',quantity) order by product_id),'[]'::jsonb)
  into v_valid_count,v_subtotal,v_is_test,v_requested_items from priced;

  if v_valid_count<>(select count(distinct x->>'product_id') from jsonb_array_elements(p_items) x) then raise exception 'unknown or inactive product'; end if;
  if v_subtotal<=0 then raise exception 'invalid subtotal'; end if;

  if v_coupon_code is not null then
    if v_is_test then raise exception 'coupons unavailable for demo catalog'; end if;
    v_discount:=padoka_private.padoka_calculate_coupon(v_coupon_code,auth.uid(),v_subtotal);
  end if;
  v_total:=round(v_subtotal-v_discount,2);
  if v_total<=0 then raise exception 'invalid total'; end if;

  select coalesce(enabled and provider_configured,false)
  into v_payment_enabled from public.padoka_payment_settings where id=true;
  v_code:='PDK-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));

  insert into public.padoka_orders(
    code,customer_id,status,pickup_mode,pickup_date,pickup_time,pickup_name,
    subtotal,discount_total,total,coupon_code,payment_method,payment_status,is_test,request_id
  )
  values(
    v_code,auth.uid(),'received',p_pickup_mode,p_pickup_date,p_pickup_time,trim(p_pickup_name),
    v_subtotal,v_discount,v_total,v_coupon_code,'pix',
    case when v_payment_enabled then 'pending' else 'not_configured' end,
    v_is_test,p_request_id
  )
  on conflict (customer_id,request_id) where request_id is not null do nothing
  returning * into v_order;

  if v_order.id is not null then
    with requested as (
      select x->>'product_id' product_id,(x->>'quantity')::integer quantity from jsonb_array_elements(p_items) x
    ), grouped as (select product_id,sum(quantity)::integer quantity from requested group by product_id)
    insert into public.padoka_order_items(order_id,product_id,product_name,quantity,unit_price)
    select v_order.id,p.id,p.name,g.quantity,p.price
    from grouped g join public.padoka_products p on p.id=g.product_id and p.active;
    return v_order;
  end if;

  select * into v_order from public.padoka_orders where customer_id=auth.uid() and request_id=p_request_id;
  if v_order.id is null then raise exception 'request reconciliation failed'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('product_id',oi.product_id,'quantity',oi.quantity) order by oi.product_id),'[]'::jsonb)
  into v_existing_items from public.padoka_order_items oi where oi.order_id=v_order.id;

  if v_order.pickup_mode is distinct from p_pickup_mode
     or v_order.pickup_date is distinct from p_pickup_date
     or v_order.pickup_time is distinct from p_pickup_time
     or v_order.pickup_name is distinct from trim(p_pickup_name)
     or v_order.coupon_code is distinct from v_coupon_code
     or v_existing_items is distinct from v_requested_items then
    raise exception 'request id conflict';
  end if;
  return v_order;
end;
$$;

revoke all on function padoka_private.padoka_create_order_once_v2(uuid,text,date,time without time zone,text,jsonb,text) from public,anon;
grant execute on function padoka_private.padoka_create_order_once_v2(uuid,text,date,time without time zone,text,jsonb,text) to authenticated,service_role;

create or replace function public.padoka_create_order_once_v2(
  p_request_id uuid,
  p_pickup_mode text,
  p_pickup_date date,
  p_pickup_time time without time zone,
  p_pickup_name text,
  p_items jsonb,
  p_coupon_code text default null
)
returns public.padoka_orders
language sql
security invoker
set search_path=''
as $$
  select padoka_private.padoka_create_order_once_v2(p_request_id,p_pickup_mode,p_pickup_date,p_pickup_time,p_pickup_name,p_items,p_coupon_code);
$$;
revoke all on function public.padoka_create_order_once_v2(uuid,text,date,time without time zone,text,jsonb,text) from public,anon;
grant execute on function public.padoka_create_order_once_v2(uuid,text,date,time without time zone,text,jsonb,text) to authenticated,service_role;

create or replace function padoka_private.padoka_create_order_once(
  p_request_id uuid,
  p_pickup_mode text,
  p_pickup_date date,
  p_pickup_time time without time zone,
  p_pickup_name text,
  p_items jsonb
)
returns public.padoka_orders
language sql
security definer
set search_path=''
as $$
  select padoka_private.padoka_create_order_once_v2(p_request_id,p_pickup_mode,p_pickup_date,p_pickup_time,p_pickup_name,p_items,null);
$$;
