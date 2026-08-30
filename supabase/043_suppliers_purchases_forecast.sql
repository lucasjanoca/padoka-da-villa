-- PADOKA DA VILLA — fornecedores, compras e previsão de produção

alter table public.padoka_inventory_movements
  drop constraint if exists padoka_inventory_movements_source_check;
alter table public.padoka_inventory_movements
  add constraint padoka_inventory_movements_source_check
  check (source = any(array['manual','sale','loss','production','adjustment','purchase']::text[]));

create table if not exists public.padoka_suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  contact_name text null check (contact_name is null or char_length(trim(contact_name))<=120),
  phone text null check (phone is null or char_length(trim(phone))<=40),
  email text null check (email is null or char_length(trim(email))<=180),
  notes text null check (notes is null or char_length(notes)<=1000),
  active boolean not null default true,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists padoka_suppliers_active_name_idx on public.padoka_suppliers(active,name);

create table if not exists public.padoka_purchase_orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  supplier_id uuid not null references public.padoka_suppliers(id) on delete restrict,
  status text not null default 'ordered' check (status in ('ordered','received','cancelled')),
  expected_date date null,
  total numeric(14,2) not null default 0 check (total>=0),
  notes text null check (notes is null or char_length(notes)<=1000),
  created_by uuid not null,
  received_by uuid null,
  received_at timestamptz null,
  cancelled_by uuid null,
  cancelled_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists padoka_purchase_orders_status_created_idx on public.padoka_purchase_orders(status,created_at desc);
create index if not exists padoka_purchase_orders_supplier_created_idx on public.padoka_purchase_orders(supplier_id,created_at desc);

create table if not exists public.padoka_purchase_order_items (
  id bigint generated always as identity primary key,
  purchase_order_id uuid not null references public.padoka_purchase_orders(id) on delete cascade,
  product_id text not null references public.padoka_products(id) on delete restrict,
  product_name text not null,
  quantity numeric(14,3) not null check (quantity>0),
  unit_cost numeric(14,2) not null check (unit_cost>=0),
  line_total numeric(14,2) not null check (line_total>=0),
  created_at timestamptz not null default now()
);
create index if not exists padoka_purchase_order_items_order_idx on public.padoka_purchase_order_items(purchase_order_id);

alter table public.padoka_suppliers enable row level security;
alter table public.padoka_purchase_orders enable row level security;
alter table public.padoka_purchase_order_items enable row level security;

revoke all on table public.padoka_suppliers,public.padoka_purchase_orders,public.padoka_purchase_order_items from public,anon,authenticated;
grant select on table public.padoka_suppliers,public.padoka_purchase_orders,public.padoka_purchase_order_items to authenticated;

drop policy if exists padoka_suppliers_staff_read on public.padoka_suppliers;
create policy padoka_suppliers_staff_read on public.padoka_suppliers
for select to authenticated
using (padoka_private.staff_has_role(array['owner','manager','stock']));

drop policy if exists padoka_purchase_orders_staff_read on public.padoka_purchase_orders;
create policy padoka_purchase_orders_staff_read on public.padoka_purchase_orders
for select to authenticated
using (padoka_private.staff_has_role(array['owner','manager','stock']));

drop policy if exists padoka_purchase_items_staff_read on public.padoka_purchase_order_items;
create policy padoka_purchase_items_staff_read on public.padoka_purchase_order_items
for select to authenticated
using (padoka_private.staff_has_role(array['owner','manager','stock']));

create or replace function padoka_private.padoka_save_supplier(
  p_id uuid,
  p_name text,
  p_contact_name text default null,
  p_phone text default null,
  p_email text default null,
  p_notes text default null,
  p_active boolean default true
)
returns public.padoka_suppliers
language plpgsql
security definer
set search_path=''
as $$
declare v_row public.padoka_suppliers;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not padoka_private.staff_has_role(array['owner','manager','stock']) then raise exception 'permission denied' using errcode='42501'; end if;
  if nullif(trim(p_name),'') is null or char_length(trim(p_name))>120 then raise exception 'invalid supplier name'; end if;
  if p_email is not null and char_length(trim(p_email))>180 then raise exception 'invalid supplier email'; end if;
  if p_notes is not null and char_length(p_notes)>1000 then raise exception 'notes too long'; end if;

  if p_id is null then
    insert into public.padoka_suppliers(name,contact_name,phone,email,notes,active,created_by,updated_by)
    values(trim(p_name),nullif(trim(p_contact_name),''),nullif(trim(p_phone),''),nullif(lower(trim(p_email)),''),nullif(trim(p_notes),''),coalesce(p_active,true),auth.uid(),auth.uid())
    returning * into v_row;
  else
    update public.padoka_suppliers s set
      name=trim(p_name),
      contact_name=nullif(trim(p_contact_name),''),
      phone=nullif(trim(p_phone),''),
      email=nullif(lower(trim(p_email)),''),
      notes=nullif(trim(p_notes),''),
      active=coalesce(p_active,true),
      updated_by=auth.uid(),
      updated_at=now()
    where s.id=p_id
    returning * into v_row;
    if v_row.id is null then raise exception 'supplier not found'; end if;
  end if;
  return v_row;
end;
$$;

revoke all on function padoka_private.padoka_save_supplier(uuid,text,text,text,text,text,boolean) from public,anon;
grant execute on function padoka_private.padoka_save_supplier(uuid,text,text,text,text,text,boolean) to authenticated,service_role;

create or replace function public.padoka_save_supplier(
  p_id uuid,
  p_name text,
  p_contact_name text default null,
  p_phone text default null,
  p_email text default null,
  p_notes text default null,
  p_active boolean default true
)
returns public.padoka_suppliers
language sql
security invoker
set search_path=''
as $$
  select padoka_private.padoka_save_supplier(p_id,p_name,p_contact_name,p_phone,p_email,p_notes,p_active);
$$;
revoke all on function public.padoka_save_supplier(uuid,text,text,text,text,text,boolean) from public,anon;
grant execute on function public.padoka_save_supplier(uuid,text,text,text,text,text,boolean) to authenticated,service_role;

create or replace function padoka_private.padoka_create_purchase_order(
  p_supplier_id uuid,
  p_expected_date date,
  p_notes text,
  p_items jsonb
)
returns public.padoka_purchase_orders
language plpgsql
security definer
set search_path=''
as $$
declare
  v_order public.padoka_purchase_orders;
  v_code text;
  v_total numeric(14,2);
  v_count integer;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not padoka_private.staff_has_role(array['owner','manager','stock']) then raise exception 'permission denied' using errcode='42501'; end if;
  if not exists(select 1 from public.padoka_suppliers s where s.id=p_supplier_id and s.active) then raise exception 'supplier unavailable'; end if;
  if p_expected_date is not null and p_expected_date < current_date then raise exception 'expected date in the past'; end if;
  if p_notes is not null and char_length(p_notes)>1000 then raise exception 'notes too long'; end if;
  if p_items is null or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 or jsonb_array_length(p_items)>100 then raise exception 'invalid purchase items'; end if;

  with raw as (
    select x->>'product_id' product_id,
           case when (x->>'quantity') ~ '^[0-9]+([.][0-9]{1,3})?$' then (x->>'quantity')::numeric else null end quantity,
           case when (x->>'unit_cost') ~ '^[0-9]+([.][0-9]{1,2})?$' then (x->>'unit_cost')::numeric else null end unit_cost
    from jsonb_array_elements(p_items) x
  ), valid as (
    select r.*,p.name from raw r join public.padoka_products p on p.id=r.product_id
    where r.quantity>0 and r.quantity<=100000 and r.unit_cost>=0 and r.unit_cost<=1000000
  )
  select count(*),coalesce(round(sum(quantity*unit_cost),2),0)
  into v_count,v_total from valid;

  if v_count<>jsonb_array_length(p_items) then raise exception 'invalid purchase item'; end if;
  v_code:='CMP-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));

  insert into public.padoka_purchase_orders(code,supplier_id,status,expected_date,total,notes,created_by)
  values(v_code,p_supplier_id,'ordered',p_expected_date,v_total,nullif(trim(p_notes),''),auth.uid())
  returning * into v_order;

  with raw as (
    select x->>'product_id' product_id,(x->>'quantity')::numeric quantity,(x->>'unit_cost')::numeric unit_cost
    from jsonb_array_elements(p_items) x
  )
  insert into public.padoka_purchase_order_items(purchase_order_id,product_id,product_name,quantity,unit_cost,line_total)
  select v_order.id,p.id,p.name,r.quantity,r.unit_cost,round(r.quantity*r.unit_cost,2)
  from raw r join public.padoka_products p on p.id=r.product_id;

  return v_order;
end;
$$;

revoke all on function padoka_private.padoka_create_purchase_order(uuid,date,text,jsonb) from public,anon;
grant execute on function padoka_private.padoka_create_purchase_order(uuid,date,text,jsonb) to authenticated,service_role;

create or replace function public.padoka_create_purchase_order(
  p_supplier_id uuid,
  p_expected_date date,
  p_notes text,
  p_items jsonb
)
returns public.padoka_purchase_orders
language sql
security invoker
set search_path=''
as $$
  select padoka_private.padoka_create_purchase_order(p_supplier_id,p_expected_date,p_notes,p_items);
$$;
revoke all on function public.padoka_create_purchase_order(uuid,date,text,jsonb) from public,anon;
grant execute on function public.padoka_create_purchase_order(uuid,date,text,jsonb) to authenticated,service_role;

create or replace function padoka_private.padoka_receive_purchase_order(p_purchase_order_id uuid)
returns public.padoka_purchase_orders
language plpgsql
security definer
set search_path=''
as $$
declare v_order public.padoka_purchase_orders; v_item record;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not padoka_private.staff_has_role(array['owner','manager','stock']) then raise exception 'permission denied' using errcode='42501'; end if;

  select * into v_order from public.padoka_purchase_orders where id=p_purchase_order_id for update;
  if v_order.id is null then raise exception 'purchase order not found'; end if;
  if v_order.status='received' then return v_order; end if;
  if v_order.status='cancelled' then raise exception 'purchase order cancelled'; end if;

  for v_item in select * from public.padoka_purchase_order_items where purchase_order_id=v_order.id order by id loop
    insert into public.padoka_inventory(product_id,quantity,min_quantity,updated_by,updated_at)
    values(v_item.product_id,v_item.quantity,0,auth.uid(),now())
    on conflict(product_id) do update set
      quantity=public.padoka_inventory.quantity+excluded.quantity,
      updated_by=auth.uid(),
      updated_at=now();

    insert into public.padoka_inventory_movements(product_id,delta,reason,source,reference_id,created_by)
    values(v_item.product_id,v_item.quantity,'Entrada da compra '||v_order.code,'purchase',v_order.id,auth.uid());
  end loop;

  update public.padoka_purchase_orders set
    status='received',received_by=auth.uid(),received_at=now(),updated_at=now()
  where id=v_order.id
  returning * into v_order;
  return v_order;
end;
$$;

revoke all on function padoka_private.padoka_receive_purchase_order(uuid) from public,anon;
grant execute on function padoka_private.padoka_receive_purchase_order(uuid) to authenticated,service_role;

create or replace function public.padoka_receive_purchase_order(p_purchase_order_id uuid)
returns public.padoka_purchase_orders
language sql
security invoker
set search_path=''
as $$ select padoka_private.padoka_receive_purchase_order(p_purchase_order_id); $$;
revoke all on function public.padoka_receive_purchase_order(uuid) from public,anon;
grant execute on function public.padoka_receive_purchase_order(uuid) to authenticated,service_role;

create or replace function public.padoka_forecast_production(p_target_date date default (current_date+1),p_weeks integer default 12)
returns table(
  product_id text,
  product_name text,
  average_quantity numeric,
  suggested_quantity numeric,
  sample_days integer,
  confidence text
)
language plpgsql
stable
security invoker
set search_path=''
as $$
declare v_weeks integer:=greatest(4,least(coalesce(p_weeks,12),52)); v_target date:=coalesce(p_target_date,current_date+1);
begin
  if not padoka_private.staff_has_role(array['owner','manager','production']) then
    raise exception 'permission denied' using errcode='42501';
  end if;
  return query
  with raw as (
    select (o.completed_at at time zone 'America/Sao_Paulo')::date as sale_day,oi.product_id,oi.product_name,oi.quantity
    from public.padoka_orders o
    join public.padoka_order_items oi on oi.order_id=o.id
    where o.status='completed' and o.payment_status in ('paid','paid_late') and not o.is_test
      and o.completed_at is not null
      and o.completed_at >= now()-make_interval(weeks=>v_weeks)
    union all
    select (s.created_at at time zone 'America/Sao_Paulo')::date as sale_day,si.product_id,si.product_name,si.quantity
    from public.padoka_sales s
    join public.padoka_sale_items si on si.sale_id=s.id
    where s.status='completed' and not s.is_test
      and s.created_at >= now()-make_interval(weeks=>v_weeks)
  ), same_weekday as (
    select r.*
    from raw r
    where extract(isodow from r.sale_day)=extract(isodow from v_target)
  ), per_day as (
    select sale_day,product_id,max(product_name) product_name,sum(quantity) qty
    from same_weekday group by sale_day,product_id
  )
  select d.product_id,max(d.product_name),
         round(avg(d.qty),2),
         ceil(avg(d.qty)*1.10),
         count(distinct d.sale_day)::integer,
         case when count(distinct d.sale_day)>=8 then 'high' when count(distinct d.sale_day)>=4 then 'medium' else 'low' end
  from per_day d
  group by d.product_id
  order by ceil(avg(d.qty)*1.10) desc,max(d.product_name);
end;
$$;
revoke all on function public.padoka_forecast_production(date,integer) from public,anon;
grant execute on function public.padoka_forecast_production(date,integer) to authenticated,service_role;
