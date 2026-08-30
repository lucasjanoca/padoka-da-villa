-- PADOKA DA VILLA — fidelidade, notificações internas e privacidade/LGPD operacional

create table if not exists public.padoka_loyalty_accounts (
  user_id uuid primary key,
  points_balance bigint not null default 0 check (points_balance >= 0),
  lifetime_points bigint not null default 0 check (lifetime_points >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.padoka_loyalty_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  order_id uuid null references public.padoka_orders(id) on delete set null,
  entry_type text not null check (entry_type in ('earn','redeem','adjust')),
  points integer not null check (points <> 0),
  description text not null check (char_length(description) between 1 and 180),
  created_at timestamptz not null default now()
);
create unique index if not exists padoka_loyalty_order_earn_uidx
  on public.padoka_loyalty_ledger(order_id)
  where order_id is not null and entry_type='earn';
create index if not exists padoka_loyalty_user_created_idx
  on public.padoka_loyalty_ledger(user_id,created_at desc);

alter table public.padoka_loyalty_accounts enable row level security;
alter table public.padoka_loyalty_ledger enable row level security;
revoke all on table public.padoka_loyalty_accounts,public.padoka_loyalty_ledger from public,anon,authenticated;
grant select on table public.padoka_loyalty_accounts,public.padoka_loyalty_ledger to authenticated;

drop policy if exists padoka_loyalty_account_own_read on public.padoka_loyalty_accounts;
create policy padoka_loyalty_account_own_read on public.padoka_loyalty_accounts
for select to authenticated using (user_id=auth.uid() or padoka_private.staff_has_role(array['owner','manager']));

drop policy if exists padoka_loyalty_ledger_own_read on public.padoka_loyalty_ledger;
create policy padoka_loyalty_ledger_own_read on public.padoka_loyalty_ledger
for select to authenticated using (user_id=auth.uid() or padoka_private.staff_has_role(array['owner','manager']));

create table if not exists public.padoka_customer_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  order_id uuid null references public.padoka_orders(id) on delete cascade,
  kind text not null check (kind in ('order','loyalty','system','promotion')),
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 360),
  read_at timestamptz null,
  created_at timestamptz not null default now()
);
create index if not exists padoka_customer_notifications_user_created_idx
  on public.padoka_customer_notifications(user_id,created_at desc);

alter table public.padoka_customer_notifications enable row level security;
revoke all on table public.padoka_customer_notifications from public,anon,authenticated;
grant select on table public.padoka_customer_notifications to authenticated;
grant update(read_at) on table public.padoka_customer_notifications to authenticated;

drop policy if exists padoka_customer_notifications_own_read on public.padoka_customer_notifications;
create policy padoka_customer_notifications_own_read on public.padoka_customer_notifications
for select to authenticated using (user_id=auth.uid());

drop policy if exists padoka_customer_notifications_own_update on public.padoka_customer_notifications;
create policy padoka_customer_notifications_own_update on public.padoka_customer_notifications
for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

create or replace function public.padoka_notification_read_guard()
returns trigger language plpgsql security invoker set search_path=''
as $$
begin
  if new.user_id is distinct from old.user_id
     or new.order_id is distinct from old.order_id
     or new.kind is distinct from old.kind
     or new.title is distinct from old.title
     or new.body is distinct from old.body
     or new.created_at is distinct from old.created_at then
    raise exception 'only read_at can be changed' using errcode='42501';
  end if;
  if new.read_at is not null and new.read_at > now()+interval '1 minute' then
    raise exception 'invalid read_at';
  end if;
  return new;
end;
$$;
revoke all on function public.padoka_notification_read_guard() from public,anon,authenticated;

drop trigger if exists padoka_notification_read_guard_trg on public.padoka_customer_notifications;
create trigger padoka_notification_read_guard_trg
before update on public.padoka_customer_notifications
for each row execute function public.padoka_notification_read_guard();

create or replace function public.padoka_order_customer_notifications()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_title text;
  v_body text;
begin
  if tg_op='INSERT' then
    v_title := 'Pedido recebido';
    v_body := 'Seu pedido '||new.code||' foi registrado e está aguardando andamento.';
  elsif new.status is not distinct from old.status then
    return new;
  else
    v_title := case new.status
      when 'seen' then 'Pedido visualizado'
      when 'confirmed' then 'Pedido confirmado'
      when 'preparing' then 'Em preparo'
      when 'ready' then 'Pedido pronto'
      when 'completed' then 'Pedido concluído'
      when 'cancelled' then 'Pedido cancelado'
      else 'Pedido atualizado'
    end;
    v_body := case new.status
      when 'seen' then 'A equipe visualizou o pedido '||new.code||'.'
      when 'confirmed' then 'O pedido '||new.code||' foi confirmado.'
      when 'preparing' then 'O pedido '||new.code||' entrou em preparo.'
      when 'ready' then 'O pedido '||new.code||' está pronto para retirada.'
      when 'completed' then 'O pedido '||new.code||' foi concluído. Obrigado!'
      when 'cancelled' then 'O pedido '||new.code||' foi cancelado.'
      else 'O pedido '||new.code||' recebeu uma atualização.'
    end;
  end if;

  insert into public.padoka_customer_notifications(user_id,order_id,kind,title,body)
  values(new.customer_id,new.id,'order',v_title,v_body);
  return new;
end;
$$;
revoke all on function public.padoka_order_customer_notifications() from public,anon,authenticated;

drop trigger if exists padoka_order_customer_notifications_trg on public.padoka_orders;
create trigger padoka_order_customer_notifications_trg
after insert or update of status on public.padoka_orders
for each row execute function public.padoka_order_customer_notifications();

create or replace function public.padoka_award_loyalty_on_real_order()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_points integer;
  v_inserted bigint;
begin
  if new.status<>'completed'
     or new.payment_status not in ('paid','paid_late')
     or new.is_test
     or new.total<=0 then
    return new;
  end if;

  if old.status='completed'
     and old.payment_status in ('paid','paid_late')
     and old.is_test=false then
    return new;
  end if;

  v_points := floor(new.total)::integer;
  if v_points<=0 then return new; end if;

  insert into public.padoka_loyalty_ledger(user_id,order_id,entry_type,points,description)
  values(new.customer_id,new.id,'earn',v_points,'Pontos do pedido '||new.code)
  on conflict (order_id) where order_id is not null and entry_type='earn' do nothing
  returning id into v_inserted;

  if v_inserted is not null then
    insert into public.padoka_loyalty_accounts(user_id,points_balance,lifetime_points)
    values(new.customer_id,v_points,v_points)
    on conflict (user_id) do update set
      points_balance=public.padoka_loyalty_accounts.points_balance+excluded.points_balance,
      lifetime_points=public.padoka_loyalty_accounts.lifetime_points+excluded.lifetime_points,
      updated_at=now();

    insert into public.padoka_customer_notifications(user_id,order_id,kind,title,body)
    values(new.customer_id,new.id,'loyalty','Você ganhou pontos',v_points||' ponto(s) foram adicionados ao seu PADOKA Club.');
  end if;
  return new;
end;
$$;
revoke all on function public.padoka_award_loyalty_on_real_order() from public,anon,authenticated;

drop trigger if exists padoka_award_loyalty_on_real_order_trg on public.padoka_orders;
create trigger padoka_award_loyalty_on_real_order_trg
after update of status,payment_status,is_test,total on public.padoka_orders
for each row execute function public.padoka_award_loyalty_on_real_order();

create table if not exists public.padoka_privacy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  request_type text not null check (request_type in ('export','delete','correct')),
  status text not null default 'pending' check (status in ('pending','in_progress','completed','rejected')),
  details text null check (details is null or char_length(details)<=600),
  resolution_note text null check (resolution_note is null or char_length(resolution_note)<=600),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz null,
  handled_by uuid null
);
create index if not exists padoka_privacy_requests_user_created_idx
  on public.padoka_privacy_requests(user_id,created_at desc);
create index if not exists padoka_privacy_requests_status_created_idx
  on public.padoka_privacy_requests(status,created_at);

alter table public.padoka_privacy_requests enable row level security;
revoke all on table public.padoka_privacy_requests from public,anon,authenticated;
grant select on table public.padoka_privacy_requests to authenticated;
grant insert(user_id,request_type,details) on table public.padoka_privacy_requests to authenticated;
grant update(status,resolution_note) on table public.padoka_privacy_requests to authenticated;

drop policy if exists padoka_privacy_own_read on public.padoka_privacy_requests;
create policy padoka_privacy_own_read on public.padoka_privacy_requests
for select to authenticated
using (user_id=auth.uid() or padoka_private.staff_has_role(array['owner']));

drop policy if exists padoka_privacy_own_insert on public.padoka_privacy_requests;
create policy padoka_privacy_own_insert on public.padoka_privacy_requests
for insert to authenticated
with check (user_id=auth.uid() and status='pending');

drop policy if exists padoka_privacy_owner_update on public.padoka_privacy_requests;
create policy padoka_privacy_owner_update on public.padoka_privacy_requests
for update to authenticated
using (padoka_private.staff_has_role(array['owner']) and coalesce(auth.jwt()->>'aal','aal1')='aal2')
with check (padoka_private.staff_has_role(array['owner']) and coalesce(auth.jwt()->>'aal','aal1')='aal2');

create or replace function public.padoka_privacy_request_guard()
returns trigger language plpgsql security invoker set search_path=''
as $$
begin
  if tg_op='INSERT' then
    new.user_id := auth.uid();
    new.status := 'pending';
    new.resolution_note := null;
    new.handled_by := null;
    new.completed_at := null;
    new.updated_at := now();
    return new;
  end if;

  new.updated_at := now();
  if new.status in ('completed','rejected') and old.status not in ('completed','rejected') then
    new.completed_at := now();
    new.handled_by := auth.uid();
  elsif new.status not in ('completed','rejected') then
    new.completed_at := null;
    new.handled_by := null;
  end if;
  return new;
end;
$$;
revoke all on function public.padoka_privacy_request_guard() from public,anon,authenticated;

drop trigger if exists padoka_privacy_request_guard_trg on public.padoka_privacy_requests;
create trigger padoka_privacy_request_guard_trg
before insert or update on public.padoka_privacy_requests
for each row execute function public.padoka_privacy_request_guard();

create or replace function public.padoka_request_privacy_action(p_type text,p_details text default null)
returns uuid
language plpgsql
security invoker
set search_path=''
as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if p_type not in ('export','delete','correct') then raise exception 'invalid request type'; end if;
  if p_details is not null and char_length(p_details)>600 then raise exception 'details too long'; end if;
  if exists(
    select 1 from public.padoka_privacy_requests r
    where r.user_id=auth.uid() and r.request_type=p_type and r.status in ('pending','in_progress')
  ) then
    raise exception 'request already pending';
  end if;
  insert into public.padoka_privacy_requests(user_id,request_type,details)
  values(auth.uid(),p_type,nullif(trim(p_details),''))
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.padoka_request_privacy_action(text,text) from public,anon;
grant execute on function public.padoka_request_privacy_action(text,text) to authenticated;

create or replace function public.padoka_export_my_data()
returns jsonb
language plpgsql
stable
security invoker
set search_path=''
as $$
declare v_uid uuid:=auth.uid(); v_result jsonb;
begin
  if v_uid is null then raise exception 'authentication required'; end if;
  select jsonb_build_object(
    'generated_at',now(),
    'profile',(select to_jsonb(p) from public.padoka_profiles p where p.id=v_uid),
    'orders',coalesce((
      select jsonb_agg(
        to_jsonb(o) || jsonb_build_object('items',coalesce((
          select jsonb_agg(to_jsonb(i) order by i.id)
          from public.padoka_order_items i where i.order_id=o.id
        ),'[]'::jsonb))
        order by o.created_at desc
      )
      from public.padoka_orders o where o.customer_id=v_uid
    ),'[]'::jsonb),
    'loyalty_account',(select to_jsonb(a) from public.padoka_loyalty_accounts a where a.user_id=v_uid),
    'loyalty_ledger',coalesce((select jsonb_agg(to_jsonb(l) order by l.created_at desc) from public.padoka_loyalty_ledger l where l.user_id=v_uid),'[]'::jsonb),
    'notifications',coalesce((select jsonb_agg(to_jsonb(n) order by n.created_at desc) from public.padoka_customer_notifications n where n.user_id=v_uid),'[]'::jsonb),
    'privacy_requests',coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at desc) from public.padoka_privacy_requests r where r.user_id=v_uid),'[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;
revoke all on function public.padoka_export_my_data() from public,anon;
grant execute on function public.padoka_export_my_data() to authenticated;
