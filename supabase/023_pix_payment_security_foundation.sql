-- PADOKA DA VILLA — fundação segura para Pix dinâmico
-- Provedor ainda NÃO configurado. O fluxo fica fechado por padrão.

create table if not exists public.padoka_payment_settings (
  id boolean primary key default true check (id = true),
  enabled boolean not null default false,
  provider text not null default 'unconfigured' check (char_length(provider) between 2 and 60),
  provider_configured boolean not null default false,
  expiration_seconds integer not null default 180 check (expiration_seconds between 60 and 900),
  late_payment_policy text not null default 'manual_review' check (late_payment_policy in ('manual_review','refund')),
  require_provider_confirmation boolean not null default true check (require_provider_confirmation = true),
  updated_at timestamptz not null default now()
);
insert into public.padoka_payment_settings(id,enabled,provider,provider_configured,expiration_seconds,late_payment_policy,require_provider_confirmation)
values(true,false,'unconfigured',false,180,'manual_review',true)
on conflict (id) do update set expiration_seconds=180,require_provider_confirmation=true,updated_at=now();
alter table public.padoka_payment_settings enable row level security;
alter table public.padoka_payment_settings force row level security;
revoke all on public.padoka_payment_settings from public,anon,authenticated;

alter table public.padoka_orders add column if not exists request_id uuid;
alter table public.padoka_orders add column if not exists payment_expires_at timestamptz;
alter table public.padoka_orders add column if not exists paid_at timestamptz;
alter table public.padoka_orders add column if not exists payment_verified_at timestamptz;
alter table public.padoka_orders add column if not exists payment_provider text;
alter table public.padoka_orders add column if not exists payment_reference text;
alter table public.padoka_orders add column if not exists late_payment_reviewed_at timestamptz;
alter table public.padoka_orders add column if not exists late_payment_reviewed_by uuid references auth.users(id);
create unique index if not exists padoka_orders_customer_request_uidx on public.padoka_orders(customer_id,request_id) where request_id is not null;
alter table public.padoka_orders drop constraint if exists padoka_orders_payment_status_check;
alter table public.padoka_orders add constraint padoka_orders_payment_status_check check (payment_status in ('not_configured','pending','paid','paid_late','expired','failed','refunded'));

create table if not exists public.padoka_payment_attempts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.padoka_orders(id) on delete cascade,
  attempt_no integer not null check (attempt_no between 1 and 20),
  provider text not null check (char_length(provider) between 2 and 60),
  provider_charge_id text,
  txid text,
  pix_copy_paste text,
  amount numeric(12,2) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending','paid','paid_late','expired','failed','refunded')),
  expires_at timestamptz not null,
  paid_at timestamptz,
  verified_at timestamptz,
  end_to_end_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(order_id,attempt_no),unique(provider,provider_charge_id),unique(provider,txid)
);
create unique index if not exists padoka_payment_one_pending_per_order_uidx on public.padoka_payment_attempts(order_id) where status='pending';
create index if not exists padoka_payment_attempts_order_idx on public.padoka_payment_attempts(order_id,created_at desc);
create index if not exists padoka_payment_attempts_expiry_idx on public.padoka_payment_attempts(status,expires_at);
alter table public.padoka_payment_attempts enable row level security;
alter table public.padoka_payment_attempts force row level security;
revoke all on public.padoka_payment_attempts from public,anon,authenticated;

create table if not exists public.padoka_payment_events (
  id bigint generated always as identity primary key,
  attempt_id uuid references public.padoka_payment_attempts(id) on delete set null,
  order_id uuid not null references public.padoka_orders(id) on delete cascade,
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  signature_valid boolean not null default false,
  amount numeric(12,2),
  result text not null check (result in ('accepted','ignored','rejected','late_review')),
  event_hash text,
  created_at timestamptz not null default now(),
  unique(provider,provider_event_id)
);
create index if not exists padoka_payment_events_order_idx on public.padoka_payment_events(order_id,created_at desc);
alter table public.padoka_payment_events enable row level security;
alter table public.padoka_payment_events force row level security;
revoke all on public.padoka_payment_events from public,anon,authenticated;

create or replace function public.padoka_payment_public_config()
returns table(enabled boolean,provider_configured boolean,provider text,expiration_seconds integer,late_payment_policy text)
language sql security definer set search_path=public stable as $$
  select s.enabled,s.provider_configured,case when s.provider_configured then s.provider else 'unconfigured' end,s.expiration_seconds,s.late_payment_policy
  from public.padoka_payment_settings s where s.id=true;
$$;
revoke all on function public.padoka_payment_public_config() from public,anon;
grant execute on function public.padoka_payment_public_config() to authenticated;

create or replace function public.padoka_get_order_payment_state(p_order_id uuid)
returns table(order_id uuid,order_code text,payment_status text,total numeric,payment_expires_at timestamptz,paid_at timestamptz,payment_provider text,attempt_id uuid,attempt_status text,pix_copy_paste text,attempt_expires_at timestamptz)
language plpgsql security definer set search_path=public stable as $$
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not exists(select 1 from public.padoka_orders o where o.id=p_order_id and (o.customer_id=auth.uid() or public.padoka_is_staff())) then raise exception 'order not found'; end if;
  return query select o.id,o.code,o.payment_status,o.total,o.payment_expires_at,o.paid_at,o.payment_provider,a.id,a.status,a.pix_copy_paste,a.expires_at
  from public.padoka_orders o left join lateral (select pa.* from public.padoka_payment_attempts pa where pa.order_id=o.id order by pa.attempt_no desc limit 1) a on true where o.id=p_order_id;
end;$$;
revoke all on function public.padoka_get_order_payment_state(uuid) from public,anon;
grant execute on function public.padoka_get_order_payment_state(uuid) to authenticated;

create or replace function public.padoka_create_payment_attempt_service(p_order_id uuid,p_provider text,p_provider_charge_id text,p_txid text,p_pix_copy_paste text,p_expires_at timestamptz)
returns public.padoka_payment_attempts language plpgsql security definer set search_path=public as $$
declare v_order public.padoka_orders;v_settings public.padoka_payment_settings;v_attempt public.padoka_payment_attempts;v_attempt_no integer;
begin
  if coalesce(auth.role(),'')<>'service_role' then raise exception 'service role required'; end if;
  select * into v_settings from public.padoka_payment_settings where id=true;
  if not v_settings.enabled or not v_settings.provider_configured then raise exception 'payment provider not configured'; end if;
  if p_provider is distinct from v_settings.provider then raise exception 'unexpected payment provider'; end if;
  if nullif(trim(p_provider_charge_id),'') is null or nullif(trim(p_txid),'') is null or nullif(trim(p_pix_copy_paste),'') is null then raise exception 'provider charge data required'; end if;
  if p_expires_at<=now() or p_expires_at>now()+make_interval(secs=>v_settings.expiration_seconds+30) then raise exception 'invalid payment expiration'; end if;
  select * into v_order from public.padoka_orders where id=p_order_id for update;
  if not found then raise exception 'order not found'; end if;
  if v_order.payment_status in ('paid','paid_late','refunded') then raise exception 'order payment already finalized'; end if;
  update public.padoka_payment_attempts set status='expired',updated_at=now() where order_id=p_order_id and status='pending' and expires_at<=now();
  if exists(select 1 from public.padoka_payment_attempts where order_id=p_order_id and status='pending') then raise exception 'pending payment already exists'; end if;
  select coalesce(max(attempt_no),0)+1 into v_attempt_no from public.padoka_payment_attempts where order_id=p_order_id;
  insert into public.padoka_payment_attempts(order_id,attempt_no,provider,provider_charge_id,txid,pix_copy_paste,amount,status,expires_at)
  values(p_order_id,v_attempt_no,p_provider,trim(p_provider_charge_id),trim(p_txid),trim(p_pix_copy_paste),v_order.total,'pending',p_expires_at) returning * into v_attempt;
  update public.padoka_orders set payment_method='pix',payment_status='pending',payment_provider=p_provider,payment_reference=trim(p_provider_charge_id),payment_expires_at=p_expires_at,paid_at=null,payment_verified_at=null,updated_at=now() where id=p_order_id;
  return v_attempt;
end;$$;
revoke all on function public.padoka_create_payment_attempt_service(uuid,text,text,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.padoka_create_payment_attempt_service(uuid,text,text,text,text,timestamptz) to service_role;

create or replace function public.padoka_apply_verified_pix_payment(p_attempt_id uuid,p_provider_event_id text,p_provider_charge_id text,p_end_to_end_id text,p_amount numeric,p_paid_at timestamptz,p_event_hash text default null)
returns public.padoka_orders language plpgsql security definer set search_path=public as $$
declare v_attempt public.padoka_payment_attempts;v_order public.padoka_orders;v_late boolean;
begin
  if coalesce(auth.role(),'')<>'service_role' then raise exception 'service role required'; end if;
  if nullif(trim(p_provider_event_id),'') is null or nullif(trim(p_provider_charge_id),'') is null or nullif(trim(p_end_to_end_id),'') is null then raise exception 'verified provider identifiers required'; end if;
  if p_paid_at is null or p_amount is null or p_amount<=0 then raise exception 'valid payment data required'; end if;
  select * into v_attempt from public.padoka_payment_attempts where id=p_attempt_id for update;
  if not found then raise exception 'payment attempt not found'; end if;
  select * into v_order from public.padoka_orders where id=v_attempt.order_id for update;
  if v_attempt.provider_charge_id is distinct from trim(p_provider_charge_id) then raise exception 'provider charge mismatch'; end if;
  if round(p_amount,2) is distinct from round(v_attempt.amount,2) or round(p_amount,2) is distinct from round(v_order.total,2) then raise exception 'payment amount mismatch'; end if;
  if exists(select 1 from public.padoka_payment_events where provider=v_attempt.provider and provider_event_id=trim(p_provider_event_id)) then return v_order; end if;
  v_late:=p_paid_at>v_attempt.expires_at;
  update public.padoka_payment_attempts set status=case when v_late then 'paid_late' else 'paid' end,paid_at=p_paid_at,verified_at=now(),end_to_end_id=trim(p_end_to_end_id),updated_at=now() where id=v_attempt.id;
  update public.padoka_orders set payment_status=case when v_late then 'paid_late' else 'paid' end,paid_at=p_paid_at,payment_verified_at=now(),payment_provider=v_attempt.provider,payment_reference=trim(p_provider_charge_id),updated_at=now() where id=v_order.id returning * into v_order;
  insert into public.padoka_payment_events(attempt_id,order_id,provider,provider_event_id,event_type,signature_valid,amount,result,event_hash)
  values(v_attempt.id,v_order.id,v_attempt.provider,trim(p_provider_event_id),'pix_confirmed',true,round(p_amount,2),case when v_late then 'late_review' else 'accepted' end,nullif(trim(coalesce(p_event_hash,'')),''));
  return v_order;
end;$$;
revoke all on function public.padoka_apply_verified_pix_payment(uuid,text,text,text,numeric,timestamptz,text) from public,anon,authenticated;
grant execute on function public.padoka_apply_verified_pix_payment(uuid,text,text,text,numeric,timestamptz,text) to service_role;

create or replace function public.padoka_expire_payment_attempt_service(p_attempt_id uuid)
returns public.padoka_orders language plpgsql security definer set search_path=public as $$
declare v_attempt public.padoka_payment_attempts;v_order public.padoka_orders;
begin
  if coalesce(auth.role(),'')<>'service_role' then raise exception 'service role required'; end if;
  select * into v_attempt from public.padoka_payment_attempts where id=p_attempt_id for update;
  if not found then raise exception 'payment attempt not found'; end if;
  select * into v_order from public.padoka_orders where id=v_attempt.order_id for update;
  if v_attempt.status='pending' and v_attempt.expires_at<=now() then
    update public.padoka_payment_attempts set status='expired',updated_at=now() where id=v_attempt.id;
    if v_order.payment_status='pending' then update public.padoka_orders set payment_status='expired',updated_at=now() where id=v_order.id returning * into v_order; end if;
  end if;
  return v_order;
end;$$;
revoke all on function public.padoka_expire_payment_attempt_service(uuid) from public,anon,authenticated;
grant execute on function public.padoka_expire_payment_attempt_service(uuid) to service_role;

create or replace function public.padoka_accept_verified_late_payment(p_order_id uuid)
returns public.padoka_orders language plpgsql security definer set search_path=public as $$
declare v_order public.padoka_orders;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not public.padoka_staff_has_role(array['owner','manager']) then raise exception 'manager permission required'; end if;
  select * into v_order from public.padoka_orders where id=p_order_id for update;
  if not found then raise exception 'order not found'; end if;
  if v_order.payment_status<>'paid_late' or v_order.payment_verified_at is null or v_order.paid_at is null then raise exception 'no verified late payment to review'; end if;
  update public.padoka_orders set payment_status='paid',late_payment_reviewed_at=now(),late_payment_reviewed_by=auth.uid(),updated_at=now() where id=p_order_id returning * into v_order;
  return v_order;
end;$$;
revoke all on function public.padoka_accept_verified_late_payment(uuid) from public,anon;
grant execute on function public.padoka_accept_verified_late_payment(uuid) to authenticated;

create or replace function public.padoka_create_order_once(p_request_id uuid,p_pickup_mode text,p_pickup_date date,p_pickup_time time without time zone,p_pickup_name text,p_items jsonb)
returns public.padoka_orders language plpgsql security definer set search_path=public as $$
declare v_order public.padoka_orders;v_total numeric(12,2);v_code text;v_requested_count integer;v_valid_count integer;v_requested_items jsonb;v_existing_items jsonb;v_is_test boolean;v_payment_enabled boolean:=false;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if p_request_id is null then raise exception 'request id required'; end if;
  if not exists(select 1 from public.padoka_profiles p where p.id=auth.uid() and p.app_scope='padoka' and p.onboarding_completed) then raise exception 'padoka onboarding required'; end if;
  if p_pickup_mode not in ('store','night') then raise exception 'invalid pickup mode'; end if;
  if p_pickup_date is null or p_pickup_time is null or nullif(trim(p_pickup_name),'') is null then raise exception 'pickup data required'; end if;
  if char_length(trim(p_pickup_name))>80 then raise exception 'pickup name too long'; end if;
  if p_pickup_date<(now() at time zone 'America/Sao_Paulo')::date or (p_pickup_date+p_pickup_time)<(now() at time zone 'America/Sao_Paulo') then raise exception 'pickup time is in the past'; end if;
  if p_items is null or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 or jsonb_array_length(p_items)>50 then raise exception 'invalid order items'; end if;
  with requested as (select x->>'product_id' product_id,case when (x->>'quantity')~'^[0-9]+$' then (x->>'quantity')::integer end quantity from jsonb_array_elements(p_items)x)
  select count(*),count(*) filter(where product_id~'^[a-z0-9][a-z0-9-]{0,63}$' and quantity between 1 and 50) into v_requested_count,v_valid_count from requested;
  if v_requested_count<>v_valid_count then raise exception 'invalid order item'; end if;
  if exists(with requested as (select x->>'product_id' product_id,(x->>'quantity')::integer quantity from jsonb_array_elements(p_items)x),grouped as(select product_id,sum(quantity)::integer quantity from requested group by product_id) select 1 from grouped where quantity>50) then raise exception 'invalid order item quantity'; end if;
  with requested as(select x->>'product_id' product_id,(x->>'quantity')::integer quantity from jsonb_array_elements(p_items)x),grouped as(select product_id,sum(quantity)::integer quantity from requested group by product_id),priced as(select g.product_id,g.quantity,p.price,p.is_demo from grouped g join public.padoka_products p on p.id=g.product_id and p.active=true)
  select count(*),coalesce(round(sum(quantity*price),2),0),coalesce(bool_or(is_demo),true),coalesce(jsonb_agg(jsonb_build_object('product_id',product_id,'quantity',quantity) order by product_id),'[]'::jsonb) into v_valid_count,v_total,v_is_test,v_requested_items from priced;
  if v_valid_count<>(select count(distinct x->>'product_id') from jsonb_array_elements(p_items)x) or v_total<=0 then raise exception 'unknown or inactive product'; end if;
  select coalesce(enabled and provider_configured,false) into v_payment_enabled from public.padoka_payment_settings where id=true;
  v_code:='PDK-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
  insert into public.padoka_orders(code,customer_id,status,pickup_mode,pickup_date,pickup_time,pickup_name,total,payment_method,payment_status,is_test,request_id)
  values(v_code,auth.uid(),'received',p_pickup_mode,p_pickup_date,p_pickup_time,trim(p_pickup_name),v_total,'pix',case when v_payment_enabled then 'pending' else 'not_configured' end,v_is_test,p_request_id)
  on conflict(customer_id,request_id) where request_id is not null do nothing returning * into v_order;
  if v_order.id is not null then
    with requested as(select x->>'product_id' product_id,(x->>'quantity')::integer quantity from jsonb_array_elements(p_items)x),grouped as(select product_id,sum(quantity)::integer quantity from requested group by product_id)
    insert into public.padoka_order_items(order_id,product_id,product_name,quantity,unit_price) select v_order.id,p.id,p.name,g.quantity,p.price from grouped g join public.padoka_products p on p.id=g.product_id and p.active=true;
    return v_order;
  end if;
  select * into v_order from public.padoka_orders where customer_id=auth.uid() and request_id=p_request_id;
  if v_order.id is null then raise exception 'request reconciliation failed'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('product_id',oi.product_id,'quantity',oi.quantity) order by oi.product_id),'[]'::jsonb) into v_existing_items from public.padoka_order_items oi where oi.order_id=v_order.id;
  if v_order.pickup_mode is distinct from p_pickup_mode or v_order.pickup_date is distinct from p_pickup_date or v_order.pickup_time is distinct from p_pickup_time or v_order.pickup_name is distinct from trim(p_pickup_name) or v_existing_items is distinct from v_requested_items then raise exception 'request id conflict'; end if;
  return v_order;
end;$$;
revoke all on function public.padoka_create_order_once(uuid,text,date,time without time zone,text,jsonb) from public,anon;
grant execute on function public.padoka_create_order_once(uuid,text,date,time without time zone,text,jsonb) to authenticated;
revoke execute on function public.padoka_create_order(text,date,time without time zone,text,jsonb) from authenticated;
revoke insert,update,delete on public.padoka_orders from authenticated;
revoke insert,update,delete on public.padoka_order_items from authenticated;
drop policy if exists padoka_customer_create_own_orders on public.padoka_orders;
drop policy if exists padoka_customer_create_own_order_items on public.padoka_order_items;

create or replace function public.padoka_update_order_status(p_order_id uuid,p_status text)
returns public.padoka_orders language plpgsql security definer set search_path=public as $$
declare v_order public.padoka_orders;v_allowed boolean:=false;v_payment_required boolean:=false;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not public.padoka_is_staff() then raise exception 'staff permission required'; end if;
  if p_status not in ('received','seen','confirmed','preparing','ready','completed','cancelled') then raise exception 'invalid order status'; end if;
  select * into v_order from public.padoka_orders where id=p_order_id for update;
  if not found then raise exception 'order not found'; end if;
  if v_order.status in ('completed','cancelled') then raise exception 'order already finalized'; end if;
  select coalesce(enabled and provider_configured,false) into v_payment_required from public.padoka_payment_settings where id=true;
  if v_payment_required and p_status in ('confirmed','preparing','ready','completed') and v_order.payment_status<>'paid' then raise exception 'payment confirmation required'; end if;
  v_allowed:=case v_order.status when 'received' then p_status in ('seen','cancelled') when 'seen' then p_status in ('confirmed','cancelled') when 'confirmed' then p_status in ('preparing','cancelled') when 'preparing' then p_status in ('ready','cancelled') when 'ready' then p_status in ('completed','cancelled') else false end;
  if not v_allowed then raise exception 'invalid status transition'; end if;
  update public.padoka_orders set status=p_status,seen_at=case when p_status='seen' and seen_at is null then now() else seen_at end,confirmed_at=case when p_status='confirmed' and confirmed_at is null then now() else confirmed_at end,preparing_at=case when p_status='preparing' and preparing_at is null then now() else preparing_at end,ready_at=case when p_status='ready' and ready_at is null then now() else ready_at end,completed_at=case when p_status='completed' and completed_at is null then now() else completed_at end,cancelled_at=case when p_status='cancelled' and cancelled_at is null then now() else cancelled_at end,updated_at=now() where id=p_order_id returning * into v_order;
  return v_order;
end;$$;
revoke all on function public.padoka_update_order_status(uuid,text) from public,anon;
grant execute on function public.padoka_update_order_status(uuid,text) to authenticated;
