
-- PADOKA DA VILLA — PADOKA Club completo e server-authoritative
-- Pontos nunca são calculados/gravados pelo navegador. Ganhos, resgates,
-- estornos e ajustes passam por funções transacionais no banco.

create table if not exists public.padoka_loyalty_settings (
  id boolean primary key default true check (id = true),
  enabled boolean not null default true,
  points_per_brl numeric(8,2) not null default 1 check (points_per_brl > 0 and points_per_brl <= 10),
  first_order_bonus_points integer not null default 20 check (first_order_bonus_points between 0 and 5000),
  birthday_multiplier numeric(4,2) not null default 2 check (birthday_multiplier between 1 and 5),
  redemption_valid_days integer not null default 30 check (redemption_valid_days between 1 and 365),
  max_points_per_order integer not null default 5000 check (max_points_per_order between 1 and 100000),
  updated_at timestamptz not null default now(),
  updated_by uuid null references auth.users(id) on delete set null
);

insert into public.padoka_loyalty_settings(id)
values(true)
on conflict (id) do nothing;

create table if not exists public.padoka_loyalty_rewards (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  description text not null default '' check (char_length(description) <= 360),
  points_cost integer not null check (points_cost between 1 and 1000000),
  active boolean not null default true,
  stock_limit integer null check (stock_limit is null or stock_limit >= 0),
  stock_redeemed integer not null default 0 check (stock_redeemed >= 0),
  per_customer_limit integer null check (per_customer_limit is null or per_customer_limit between 1 and 1000),
  valid_from timestamptz null,
  valid_until timestamptz null,
  badge text null check (badge is null or char_length(badge) <= 40),
  sort_order integer not null default 0 check (sort_order between -10000 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references auth.users(id) on delete set null,
  updated_by uuid null references auth.users(id) on delete set null,
  check (valid_until is null or valid_from is null or valid_until > valid_from),
  check (stock_limit is null or stock_redeemed <= stock_limit)
);

create unique index if not exists padoka_loyalty_rewards_name_uidx
  on public.padoka_loyalty_rewards(lower(name));
create index if not exists padoka_loyalty_rewards_active_sort_idx
  on public.padoka_loyalty_rewards(active, sort_order, points_cost);

create table if not exists public.padoka_loyalty_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  description text not null default '' check (char_length(description) <= 360),
  multiplier numeric(4,2) not null default 1 check (multiplier between 1 and 5),
  bonus_points integer not null default 0 check (bonus_points between 0 and 5000),
  min_order_total numeric(12,2) not null default 0 check (min_order_total >= 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references auth.users(id) on delete set null,
  updated_by uuid null references auth.users(id) on delete set null,
  check (ends_at > starts_at)
);

create index if not exists padoka_loyalty_campaigns_active_window_idx
  on public.padoka_loyalty_campaigns(active, starts_at, ends_at);

create table if not exists public.padoka_loyalty_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reward_id uuid not null references public.padoka_loyalty_rewards(id) on delete restrict,
  code text not null unique check (code ~ '^PDK-[A-F0-9]{12}$'),
  reward_name text not null check (char_length(reward_name) between 2 and 120),
  points_spent integer not null check (points_spent > 0),
  status text not null default 'reserved' check (status in ('reserved','used','cancelled','expired')),
  expires_at timestamptz not null,
  used_at timestamptz null,
  used_by uuid null references auth.users(id) on delete set null,
  cancelled_at timestamptz null,
  created_at timestamptz not null default now(),
  check (expires_at > created_at),
  check (
    (status = 'used' and used_at is not null and used_by is not null)
    or (status <> 'used' and used_at is null)
  )
);

create index if not exists padoka_loyalty_redemptions_user_created_idx
  on public.padoka_loyalty_redemptions(user_id, created_at desc);
create index if not exists padoka_loyalty_redemptions_status_expiry_idx
  on public.padoka_loyalty_redemptions(status, expires_at);
create index if not exists padoka_loyalty_redemptions_reward_idx
  on public.padoka_loyalty_redemptions(reward_id, status);

create table if not exists public.padoka_loyalty_admin_audit (
  id bigint generated always as identity primary key,
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  action text not null check (char_length(action) between 2 and 80),
  target_user_id uuid null references auth.users(id) on delete set null,
  reward_id uuid null references public.padoka_loyalty_rewards(id) on delete set null,
  redemption_id uuid null references public.padoka_loyalty_redemptions(id) on delete set null,
  delta_points integer null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists padoka_loyalty_admin_audit_created_idx
  on public.padoka_loyalty_admin_audit(created_at desc);

alter table public.padoka_loyalty_accounts
  add column if not exists last_earned_at timestamptz null,
  add column if not exists last_redeemed_at timestamptz null;

alter table public.padoka_loyalty_ledger
  add column if not exists source text,
  add column if not exists balance_after bigint,
  add column if not exists campaign_id uuid null,
  add column if not exists redemption_id uuid null,
  add column if not exists actor_user_id uuid null;

update public.padoka_loyalty_ledger
set source = coalesce(source, case
  when entry_type='earn' then 'order'
  when entry_type='redeem' then 'reward'
  else 'legacy'
end)
where source is null;

update public.padoka_loyalty_ledger
set balance_after = coalesce(balance_after, 0)
where balance_after is null;

alter table public.padoka_loyalty_ledger
  alter column source set not null,
  alter column balance_after set not null;

alter table public.padoka_loyalty_ledger
  drop constraint if exists padoka_loyalty_ledger_entry_type_check;
alter table public.padoka_loyalty_ledger
  add constraint padoka_loyalty_ledger_entry_type_check
  check (entry_type in ('earn','redeem','adjust','expire'));

alter table public.padoka_loyalty_ledger
  drop constraint if exists padoka_loyalty_ledger_balance_after_check;
alter table public.padoka_loyalty_ledger
  add constraint padoka_loyalty_ledger_balance_after_check
  check (balance_after >= 0);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname='padoka_loyalty_accounts_user_fk'
      and conrelid='public.padoka_loyalty_accounts'::regclass
  ) then
    alter table public.padoka_loyalty_accounts
      add constraint padoka_loyalty_accounts_user_fk
      foreign key(user_id) references auth.users(id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname='padoka_loyalty_ledger_user_fk'
      and conrelid='public.padoka_loyalty_ledger'::regclass
  ) then
    alter table public.padoka_loyalty_ledger
      add constraint padoka_loyalty_ledger_user_fk
      foreign key(user_id) references auth.users(id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname='padoka_loyalty_ledger_campaign_fk'
      and conrelid='public.padoka_loyalty_ledger'::regclass
  ) then
    alter table public.padoka_loyalty_ledger
      add constraint padoka_loyalty_ledger_campaign_fk
      foreign key(campaign_id) references public.padoka_loyalty_campaigns(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname='padoka_loyalty_ledger_redemption_fk'
      and conrelid='public.padoka_loyalty_ledger'::regclass
  ) then
    alter table public.padoka_loyalty_ledger
      add constraint padoka_loyalty_ledger_redemption_fk
      foreign key(redemption_id) references public.padoka_loyalty_redemptions(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname='padoka_loyalty_ledger_actor_fk'
      and conrelid='public.padoka_loyalty_ledger'::regclass
  ) then
    alter table public.padoka_loyalty_ledger
      add constraint padoka_loyalty_ledger_actor_fk
      foreign key(actor_user_id) references auth.users(id) on delete set null;
  end if;
end
$$;

create unique index if not exists padoka_loyalty_redemption_entry_uidx
  on public.padoka_loyalty_ledger(redemption_id, entry_type)
  where redemption_id is not null;

insert into public.padoka_loyalty_rewards(name,description,points_cost,badge,sort_order)
values
  ('Café expresso','Troque seus pontos por um café expresso da casa.',50,'Comece aqui',10),
  ('100 g de pão de queijo','Uma porção de 100 g de pão de queijo.',100,'Popular',20),
  ('Fatia de bolo + café','Uma fatia de bolo acompanhada de café.',200,'Doce',30),
  ('Cappuccino + croissant','Um cappuccino e um croissant para aproveitar na PADOKA.',300,'Especial',40)
on conflict do nothing;

insert into public.padoka_loyalty_campaigns(
  name,description,multiplier,bonus_points,min_order_total,starts_at,ends_at,active
)
select
  'Fim de semana em dobro',
  'Modelo de campanha para ativar pontos em dobro em um período definido.',
  2,0,0,
  date_trunc('day',now()) + interval '365 days',
  date_trunc('day',now()) + interval '367 days',
  false
where not exists (
  select 1 from public.padoka_loyalty_campaigns where lower(name)=lower('Fim de semana em dobro')
);

alter table public.padoka_loyalty_settings enable row level security;
alter table public.padoka_loyalty_rewards enable row level security;
alter table public.padoka_loyalty_campaigns enable row level security;
alter table public.padoka_loyalty_redemptions enable row level security;
alter table public.padoka_loyalty_admin_audit enable row level security;

revoke all on table
  public.padoka_loyalty_settings,
  public.padoka_loyalty_rewards,
  public.padoka_loyalty_campaigns,
  public.padoka_loyalty_redemptions,
  public.padoka_loyalty_admin_audit
from public, anon, authenticated;

grant select on table
  public.padoka_loyalty_settings,
  public.padoka_loyalty_rewards,
  public.padoka_loyalty_campaigns,
  public.padoka_loyalty_redemptions
to authenticated;
grant select on table public.padoka_loyalty_admin_audit to authenticated;

revoke insert, update, delete on table
  public.padoka_loyalty_accounts,
  public.padoka_loyalty_ledger
from anon, authenticated;

drop policy if exists padoka_loyalty_settings_read on public.padoka_loyalty_settings;
create policy padoka_loyalty_settings_read
on public.padoka_loyalty_settings
for select to authenticated
using ((select auth.uid()) is not null);

drop policy if exists padoka_loyalty_rewards_read on public.padoka_loyalty_rewards;
create policy padoka_loyalty_rewards_read
on public.padoka_loyalty_rewards
for select to authenticated
using (
  active = true
  or (select padoka_private.staff_has_role(array['owner','manager','cashier','attendant']))
);

drop policy if exists padoka_loyalty_campaigns_read on public.padoka_loyalty_campaigns;
create policy padoka_loyalty_campaigns_read
on public.padoka_loyalty_campaigns
for select to authenticated
using (
  active = true
  or (select padoka_private.staff_has_role(array['owner','manager']))
);

drop policy if exists padoka_loyalty_redemptions_read on public.padoka_loyalty_redemptions;
create policy padoka_loyalty_redemptions_read
on public.padoka_loyalty_redemptions
for select to authenticated
using (
  user_id = (select auth.uid())
  or (select padoka_private.staff_has_role(array['owner','manager']))
);

drop policy if exists padoka_loyalty_admin_audit_read on public.padoka_loyalty_admin_audit;
create policy padoka_loyalty_admin_audit_read
on public.padoka_loyalty_admin_audit
for select to authenticated
using ((select padoka_private.staff_has_role(array['owner','manager'])));

create or replace function padoka_private.loyalty_require_manager()
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode='42501';
  end if;
  if coalesce(auth.jwt()->>'aal','aal1') <> 'aal2' then
    raise exception 'mfa required' using errcode='42501';
  end if;
  if not padoka_private.staff_has_role(array['owner','manager']) then
    raise exception 'permission required' using errcode='42501';
  end if;
end;
$$;

create or replace function padoka_private.loyalty_counter_role()
returns text
language plpgsql
security definer
set search_path=''
as $$
declare
  v_role text;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode='42501';
  end if;

  select s.role into v_role
  from public.padoka_staff_users s
  where s.user_id=(select auth.uid())
    and s.active=true;

  if v_role not in ('owner','manager','cashier','attendant') then
    raise exception 'permission required' using errcode='42501';
  end if;

  if v_role in ('owner','manager')
     and coalesce(auth.jwt()->>'aal','aal1') <> 'aal2' then
    raise exception 'mfa required' using errcode='42501';
  end if;

  return v_role;
end;
$$;

revoke all on function padoka_private.loyalty_require_manager() from public,anon,authenticated;
revoke all on function padoka_private.loyalty_counter_role() from public,anon,authenticated;

create or replace function padoka_private.padoka_award_loyalty_on_real_order()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_enabled boolean;
  v_rate numeric(8,2);
  v_first_bonus integer;
  v_birthday_multiplier numeric(4,2);
  v_cap integer;
  v_balance bigint;
  v_base integer;
  v_points integer;
  v_bonus integer := 0;
  v_multiplier numeric(4,2) := 1;
  v_campaign_id uuid;
  v_campaign_name text;
  v_campaign_multiplier numeric(4,2);
  v_campaign_bonus integer;
  v_birthday date;
  v_local_date date;
  v_is_first boolean;
  v_inserted bigint;
  v_description text;
begin
  if new.status <> 'completed'
     or new.payment_status not in ('paid','paid_late')
     or new.is_test
     or new.total <= 0 then
    return new;
  end if;

  if old.status='completed'
     and old.payment_status in ('paid','paid_late')
     and old.is_test=false then
    return new;
  end if;

  select s.enabled,s.points_per_brl,s.first_order_bonus_points,
         s.birthday_multiplier,s.max_points_per_order
    into v_enabled,v_rate,v_first_bonus,v_birthday_multiplier,v_cap
  from public.padoka_loyalty_settings s
  where s.id=true;

  if not coalesce(v_enabled,false) then
    return new;
  end if;

  insert into public.padoka_loyalty_accounts(user_id,points_balance,lifetime_points)
  values(new.customer_id,0,0)
  on conflict (user_id) do nothing;

  select a.points_balance
    into v_balance
  from public.padoka_loyalty_accounts a
  where a.user_id=new.customer_id
  for update;

  if exists(
    select 1 from public.padoka_loyalty_ledger l
    where l.order_id=new.id and l.entry_type='earn'
  ) then
    return new;
  end if;

  select not exists(
    select 1 from public.padoka_loyalty_ledger l
    where l.user_id=new.customer_id and l.entry_type='earn'
  ) into v_is_first;

  select c.id,c.name,c.multiplier,c.bonus_points
    into v_campaign_id,v_campaign_name,v_campaign_multiplier,v_campaign_bonus
  from public.padoka_loyalty_campaigns c
  where c.active=true
    and coalesce(new.completed_at,now()) >= c.starts_at
    and coalesce(new.completed_at,now()) < c.ends_at
    and new.total >= c.min_order_total
  order by c.multiplier desc,c.bonus_points desc,c.created_at asc
  limit 1;

  if v_campaign_id is not null then
    v_multiplier := greatest(v_multiplier,coalesce(v_campaign_multiplier,1));
    v_bonus := v_bonus + coalesce(v_campaign_bonus,0);
  end if;

  select p.birthday into v_birthday
  from public.padoka_profiles p
  where p.id=new.customer_id;

  v_local_date := (coalesce(new.completed_at,now()) at time zone 'America/Sao_Paulo')::date;

  if v_birthday is not null
     and extract(month from v_birthday)=extract(month from v_local_date)
     and extract(day from v_birthday)=extract(day from v_local_date) then
    v_multiplier := greatest(v_multiplier,coalesce(v_birthday_multiplier,1));
  end if;

  if v_is_first then
    v_bonus := v_bonus + coalesce(v_first_bonus,0);
  end if;

  v_base := floor(new.total * coalesce(v_rate,1))::integer;
  v_points := least(
    coalesce(v_cap,5000),
    greatest(0,floor(v_base * v_multiplier)::integer + v_bonus)
  );

  if v_points <= 0 then
    return new;
  end if;

  v_description := 'Pontos do pedido '||new.code;
  if v_campaign_name is not null then
    v_description := v_description||' • '||left(v_campaign_name,80);
  end if;
  if v_is_first and v_first_bonus>0 then
    v_description := v_description||' • bônus 1ª compra';
  end if;
  if v_birthday is not null
     and extract(month from v_birthday)=extract(month from v_local_date)
     and extract(day from v_birthday)=extract(day from v_local_date)
     and v_birthday_multiplier>1 then
    v_description := v_description||' • aniversário';
  end if;

  insert into public.padoka_loyalty_ledger(
    user_id,order_id,entry_type,points,description,source,
    balance_after,campaign_id,actor_user_id
  )
  values(
    new.customer_id,new.id,'earn',v_points,left(v_description,180),'order',
    v_balance+v_points,v_campaign_id,null
  )
  on conflict (order_id) where order_id is not null and entry_type='earn'
  do nothing
  returning id into v_inserted;

  if v_inserted is not null then
    update public.padoka_loyalty_accounts a
       set points_balance=v_balance+v_points,
           lifetime_points=a.lifetime_points+v_points,
           last_earned_at=now(),
           updated_at=now()
     where a.user_id=new.customer_id;

    insert into public.padoka_customer_notifications(user_id,order_id,kind,title,body)
    values(
      new.customer_id,new.id,'loyalty','Você ganhou pontos',
      v_points||' ponto(s) foram adicionados ao seu PADOKA Club.'
    );
  end if;

  return new;
end;
$$;

revoke all on function padoka_private.padoka_award_loyalty_on_real_order() from public,anon,authenticated;

drop trigger if exists padoka_award_loyalty_on_real_order_trg on public.padoka_orders;
create trigger padoka_award_loyalty_on_real_order_trg
after update of status,payment_status,is_test,total on public.padoka_orders
for each row execute function padoka_private.padoka_award_loyalty_on_real_order();

create or replace function padoka_private.loyalty_refund_redemption(
  p_redemption_id uuid,
  p_status text,
  p_actor uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_red public.padoka_loyalty_redemptions%rowtype;
  v_balance bigint;
  v_refund_id bigint;
begin
  if p_status not in ('cancelled','expired') then
    raise exception 'invalid refund status';
  end if;

  select * into v_red
  from public.padoka_loyalty_redemptions r
  where r.id=p_redemption_id
  for update;

  if not found then
    raise exception 'redemption not found';
  end if;

  if v_red.status <> 'reserved' then
    return jsonb_build_object(
      'id',v_red.id,'status',v_red.status,'refunded',false
    );
  end if;

  insert into public.padoka_loyalty_accounts(user_id,points_balance,lifetime_points)
  values(v_red.user_id,0,0)
  on conflict (user_id) do nothing;

  select a.points_balance into v_balance
  from public.padoka_loyalty_accounts a
  where a.user_id=v_red.user_id
  for update;

  update public.padoka_loyalty_redemptions
     set status=p_status,
         cancelled_at=case when p_status='cancelled' then now() else null end
   where id=v_red.id;

  update public.padoka_loyalty_rewards
     set stock_redeemed=greatest(0,stock_redeemed-1),
         updated_at=now()
   where id=v_red.reward_id;

  insert into public.padoka_loyalty_ledger(
    user_id,entry_type,points,description,source,balance_after,
    redemption_id,actor_user_id
  )
  values(
    v_red.user_id,
    case when p_status='expired' then 'expire' else 'adjust' end,
    v_red.points_spent,
    left(coalesce(nullif(trim(p_reason),''),'Estorno de resgate'),180),
    case when p_status='expired' then 'redemption_expiry' else 'redemption_cancel' end,
    v_balance+v_red.points_spent,
    v_red.id,p_actor
  )
  on conflict (redemption_id,entry_type) where redemption_id is not null
  do nothing
  returning id into v_refund_id;

  if v_refund_id is not null then
    update public.padoka_loyalty_accounts
       set points_balance=v_balance+v_red.points_spent,
           updated_at=now()
     where user_id=v_red.user_id;

    insert into public.padoka_customer_notifications(user_id,kind,title,body)
    values(
      v_red.user_id,'loyalty',
      case when p_status='expired' then 'Resgate expirado' else 'Resgate cancelado' end,
      v_red.points_spent||' ponto(s) voltaram para o seu saldo.'
    );
  end if;

  return jsonb_build_object(
    'id',v_red.id,
    'status',p_status,
    'refunded',v_refund_id is not null,
    'points',v_red.points_spent
  );
end;
$$;

revoke all on function padoka_private.loyalty_refund_redemption(uuid,text,uuid,text)
from public,anon,authenticated;

create or replace function padoka_rpc_private.redeem_reward(p_reward_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid := auth.uid();
  v_reward public.padoka_loyalty_rewards%rowtype;
  v_settings public.padoka_loyalty_settings%rowtype;
  v_balance bigint;
  v_count integer;
  v_code text;
  v_expires timestamptz;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode='42501';
  end if;

  select * into v_settings
  from public.padoka_loyalty_settings
  where id=true;

  if not coalesce(v_settings.enabled,false) then
    raise exception 'loyalty unavailable';
  end if;

  select * into v_reward
  from public.padoka_loyalty_rewards r
  where r.id=p_reward_id
  for update;

  if not found or not v_reward.active then
    raise exception 'reward unavailable';
  end if;

  if v_reward.valid_from is not null and now()<v_reward.valid_from then
    raise exception 'reward not started';
  end if;
  if v_reward.valid_until is not null and now()>=v_reward.valid_until then
    raise exception 'reward expired';
  end if;
  if v_reward.stock_limit is not null and v_reward.stock_redeemed>=v_reward.stock_limit then
    raise exception 'reward out of stock';
  end if;

  insert into public.padoka_loyalty_accounts(user_id,points_balance,lifetime_points)
  values(v_uid,0,0)
  on conflict (user_id) do nothing;

  select a.points_balance into v_balance
  from public.padoka_loyalty_accounts a
  where a.user_id=v_uid
  for update;

  if v_balance < v_reward.points_cost then
    raise exception 'insufficient points';
  end if;

  if v_reward.per_customer_limit is not null then
    select count(*)::integer into v_count
    from public.padoka_loyalty_redemptions r
    where r.user_id=v_uid
      and r.reward_id=v_reward.id
      and r.status in ('reserved','used');
    if v_count >= v_reward.per_customer_limit then
      raise exception 'reward customer limit reached';
    end if;
  end if;

  v_expires := now()+make_interval(days=>v_settings.redemption_valid_days);
  if v_reward.valid_until is not null then
    v_expires := least(v_expires,v_reward.valid_until);
  end if;
  if v_expires <= now() then
    raise exception 'reward expired';
  end if;

  loop
    v_code := 'PDK-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
    exit when not exists(
      select 1 from public.padoka_loyalty_redemptions r where r.code=v_code
    );
  end loop;

  insert into public.padoka_loyalty_redemptions(
    user_id,reward_id,code,reward_name,points_spent,expires_at
  )
  values(
    v_uid,v_reward.id,v_code,v_reward.name,v_reward.points_cost,v_expires
  )
  returning id into v_id;

  insert into public.padoka_loyalty_ledger(
    user_id,entry_type,points,description,source,balance_after,
    redemption_id,actor_user_id
  )
  values(
    v_uid,'redeem',-v_reward.points_cost,
    left('Resgate: '||v_reward.name,180),'reward',
    v_balance-v_reward.points_cost,v_id,null
  );

  update public.padoka_loyalty_accounts
     set points_balance=v_balance-v_reward.points_cost,
         last_redeemed_at=now(),
         updated_at=now()
   where user_id=v_uid;

  update public.padoka_loyalty_rewards
     set stock_redeemed=stock_redeemed+1,
         updated_at=now()
   where id=v_reward.id;

  insert into public.padoka_customer_notifications(user_id,kind,title,body)
  values(
    v_uid,'loyalty','Recompensa resgatada',
    v_reward.name||' foi reservada. Mostre o código '||v_code||' na PADOKA.'
  );

  return jsonb_build_object(
    'id',v_id,
    'code',v_code,
    'reward_name',v_reward.name,
    'points_spent',v_reward.points_cost,
    'status','reserved',
    'expires_at',v_expires,
    'balance_after',v_balance-v_reward.points_cost
  );
end;
$$;

create or replace function padoka_rpc_private.cancel_redemption(p_redemption_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_owner uuid;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode='42501';
  end if;

  select r.user_id into v_owner
  from public.padoka_loyalty_redemptions r
  where r.id=p_redemption_id;

  if v_owner is null then
    raise exception 'redemption not found';
  end if;
  if v_owner<>v_uid then
    raise exception 'permission required' using errcode='42501';
  end if;

  return padoka_private.loyalty_refund_redemption(
    p_redemption_id,'cancelled',v_uid,'Cancelamento solicitado pelo cliente'
  );
end;
$$;

create or replace function padoka_rpc_private.admin_loyalty_customers(
  p_search text default '',
  p_limit integer default 50
)
returns table(
  user_id uuid,
  full_name text,
  email text,
  phone text,
  points_balance bigint,
  lifetime_points bigint,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path=''
as $$
declare
  v_q text:=lower(trim(coalesce(p_search,'')));
  v_limit integer:=least(greatest(coalesce(p_limit,50),1),100);
begin
  perform padoka_private.loyalty_require_manager();

  return query
  select
    u.id,
    left(coalesce(nullif(trim(p.full_name),''),split_part(coalesce(u.email,''),'@',1),'Cliente'),80),
    left(coalesce(u.email,''),254),
    left(coalesce(p.phone,''),40),
    coalesce(a.points_balance,0),
    coalesce(a.lifetime_points,0),
    coalesce(a.updated_at,p.updated_at,u.updated_at)
  from auth.users u
  left join public.padoka_profiles p on p.id=u.id
  left join public.padoka_loyalty_accounts a on a.user_id=u.id
  where (
    v_q=''
    or lower(coalesce(p.full_name,'')) like '%'||v_q||'%'
    or lower(coalesce(u.email,'')) like '%'||v_q||'%'
    or lower(coalesce(p.phone,'')) like '%'||v_q||'%'
  )
  order by coalesce(a.updated_at,p.updated_at,u.updated_at) desc
  limit v_limit;
end;
$$;

create or replace function padoka_rpc_private.admin_adjust_loyalty(
  p_user_id uuid,
  p_points integer,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_balance bigint;
  v_new_balance bigint;
  v_reason text:=trim(coalesce(p_reason,''));
begin
  perform padoka_private.loyalty_require_manager();

  if p_points=0 or abs(p_points)>10000 then
    raise exception 'invalid points adjustment';
  end if;
  if char_length(v_reason)<5 or char_length(v_reason)>180 then
    raise exception 'invalid adjustment reason';
  end if;
  if not exists(select 1 from auth.users u where u.id=p_user_id) then
    raise exception 'customer not found';
  end if;

  insert into public.padoka_loyalty_accounts(user_id,points_balance,lifetime_points)
  values(p_user_id,0,0)
  on conflict (user_id) do nothing;

  select a.points_balance into v_balance
  from public.padoka_loyalty_accounts a
  where a.user_id=p_user_id
  for update;

  v_new_balance:=v_balance+p_points;
  if v_new_balance<0 then
    raise exception 'insufficient customer balance';
  end if;

  insert into public.padoka_loyalty_ledger(
    user_id,entry_type,points,description,source,balance_after,actor_user_id
  )
  values(
    p_user_id,'adjust',p_points,v_reason,'admin_adjustment',
    v_new_balance,auth.uid()
  );

  update public.padoka_loyalty_accounts
     set points_balance=v_new_balance,
         updated_at=now()
   where user_id=p_user_id;

  insert into public.padoka_loyalty_admin_audit(
    actor_user_id,action,target_user_id,delta_points,details
  )
  values(
    auth.uid(),'adjust_points',p_user_id,p_points,
    jsonb_build_object('reason',v_reason,'balance_before',v_balance,'balance_after',v_new_balance)
  );

  insert into public.padoka_customer_notifications(user_id,kind,title,body)
  values(
    p_user_id,'loyalty','Saldo do PADOKA Club ajustado',
    case when p_points>0 then '+' else '' end||p_points||
    ' ponto(s). Motivo: '||v_reason
  );

  return jsonb_build_object(
    'user_id',p_user_id,'delta',p_points,'balance_after',v_new_balance
  );
end;
$$;

create or replace function padoka_rpc_private.admin_upsert_loyalty_reward(
  p_id uuid,
  p_name text,
  p_description text,
  p_points_cost integer,
  p_active boolean,
  p_stock_limit integer,
  p_per_customer_limit integer,
  p_valid_from timestamptz,
  p_valid_until timestamptz,
  p_badge text,
  p_sort_order integer
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_id uuid:=p_id;
  v_name text:=trim(coalesce(p_name,''));
  v_description text:=trim(coalesce(p_description,''));
  v_badge text:=nullif(trim(coalesce(p_badge,'')),'');
  v_redeemed integer;
begin
  perform padoka_private.loyalty_require_manager();

  if char_length(v_name)<2 or char_length(v_name)>120 then raise exception 'invalid reward name'; end if;
  if char_length(v_description)>360 then raise exception 'reward description too long'; end if;
  if p_points_cost is null or p_points_cost<1 or p_points_cost>1000000 then raise exception 'invalid points cost'; end if;
  if p_stock_limit is not null and p_stock_limit<0 then raise exception 'invalid stock limit'; end if;
  if p_per_customer_limit is not null and (p_per_customer_limit<1 or p_per_customer_limit>1000) then raise exception 'invalid customer limit'; end if;
  if p_valid_until is not null and p_valid_from is not null and p_valid_until<=p_valid_from then raise exception 'invalid reward period'; end if;
  if v_badge is not null and char_length(v_badge)>40 then raise exception 'badge too long'; end if;

  if v_id is null then
    insert into public.padoka_loyalty_rewards(
      name,description,points_cost,active,stock_limit,per_customer_limit,
      valid_from,valid_until,badge,sort_order,created_by,updated_by
    )
    values(
      v_name,v_description,p_points_cost,coalesce(p_active,true),p_stock_limit,p_per_customer_limit,
      p_valid_from,p_valid_until,v_badge,coalesce(p_sort_order,0),auth.uid(),auth.uid()
    )
    returning id into v_id;
  else
    select r.stock_redeemed into v_redeemed
    from public.padoka_loyalty_rewards r
    where r.id=v_id
    for update;
    if not found then raise exception 'reward not found'; end if;
    if p_stock_limit is not null and p_stock_limit<v_redeemed then raise exception 'stock below redeemed count'; end if;

    update public.padoka_loyalty_rewards r
       set name=v_name,
           description=v_description,
           points_cost=p_points_cost,
           active=coalesce(p_active,false),
           stock_limit=p_stock_limit,
           per_customer_limit=p_per_customer_limit,
           valid_from=p_valid_from,
           valid_until=p_valid_until,
           badge=v_badge,
           sort_order=coalesce(p_sort_order,0),
           updated_at=now(),
           updated_by=auth.uid()
     where r.id=v_id;
  end if;

  insert into public.padoka_loyalty_admin_audit(
    actor_user_id,action,reward_id,details
  )
  values(
    auth.uid(),'upsert_reward',v_id,
    jsonb_build_object('name',v_name,'points_cost',p_points_cost,'active',coalesce(p_active,false))
  );

  return v_id;
end;
$$;

create or replace function padoka_rpc_private.admin_upsert_loyalty_campaign(
  p_id uuid,
  p_name text,
  p_description text,
  p_multiplier numeric,
  p_bonus_points integer,
  p_min_order_total numeric,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_active boolean
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_id uuid:=p_id;
  v_name text:=trim(coalesce(p_name,''));
  v_description text:=trim(coalesce(p_description,''));
begin
  perform padoka_private.loyalty_require_manager();

  if char_length(v_name)<2 or char_length(v_name)>120 then raise exception 'invalid campaign name'; end if;
  if char_length(v_description)>360 then raise exception 'campaign description too long'; end if;
  if p_multiplier is null or p_multiplier<1 or p_multiplier>5 then raise exception 'invalid campaign multiplier'; end if;
  if p_bonus_points is null or p_bonus_points<0 or p_bonus_points>5000 then raise exception 'invalid campaign bonus'; end if;
  if p_min_order_total is null or p_min_order_total<0 then raise exception 'invalid minimum order'; end if;
  if p_starts_at is null or p_ends_at is null or p_ends_at<=p_starts_at then raise exception 'invalid campaign period'; end if;

  if v_id is null then
    insert into public.padoka_loyalty_campaigns(
      name,description,multiplier,bonus_points,min_order_total,
      starts_at,ends_at,active,created_by,updated_by
    )
    values(
      v_name,v_description,p_multiplier,p_bonus_points,p_min_order_total,
      p_starts_at,p_ends_at,coalesce(p_active,false),auth.uid(),auth.uid()
    )
    returning id into v_id;
  else
    if not exists(select 1 from public.padoka_loyalty_campaigns c where c.id=v_id) then
      raise exception 'campaign not found';
    end if;
    update public.padoka_loyalty_campaigns c
       set name=v_name,
           description=v_description,
           multiplier=p_multiplier,
           bonus_points=p_bonus_points,
           min_order_total=p_min_order_total,
           starts_at=p_starts_at,
           ends_at=p_ends_at,
           active=coalesce(p_active,false),
           updated_at=now(),
           updated_by=auth.uid()
     where c.id=v_id;
  end if;

  insert into public.padoka_loyalty_admin_audit(
    actor_user_id,action,details
  )
  values(
    auth.uid(),'upsert_campaign',
    jsonb_build_object(
      'campaign_id',v_id,'name',v_name,'multiplier',p_multiplier,
      'bonus_points',p_bonus_points,'active',coalesce(p_active,false)
    )
  );

  return v_id;
end;
$$;

create or replace function padoka_rpc_private.admin_update_loyalty_settings(
  p_enabled boolean,
  p_points_per_brl numeric,
  p_first_order_bonus_points integer,
  p_birthday_multiplier numeric,
  p_redemption_valid_days integer,
  p_max_points_per_order integer
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
begin
  perform padoka_private.loyalty_require_manager();

  if p_points_per_brl is null or p_points_per_brl<=0 or p_points_per_brl>10 then raise exception 'invalid points rate'; end if;
  if p_first_order_bonus_points is null or p_first_order_bonus_points<0 or p_first_order_bonus_points>5000 then raise exception 'invalid first order bonus'; end if;
  if p_birthday_multiplier is null or p_birthday_multiplier<1 or p_birthday_multiplier>5 then raise exception 'invalid birthday multiplier'; end if;
  if p_redemption_valid_days is null or p_redemption_valid_days<1 or p_redemption_valid_days>365 then raise exception 'invalid redemption validity'; end if;
  if p_max_points_per_order is null or p_max_points_per_order<1 or p_max_points_per_order>100000 then raise exception 'invalid points cap'; end if;

  update public.padoka_loyalty_settings
     set enabled=coalesce(p_enabled,false),
         points_per_brl=p_points_per_brl,
         first_order_bonus_points=p_first_order_bonus_points,
         birthday_multiplier=p_birthday_multiplier,
         redemption_valid_days=p_redemption_valid_days,
         max_points_per_order=p_max_points_per_order,
         updated_at=now(),
         updated_by=auth.uid()
   where id=true;

  insert into public.padoka_loyalty_admin_audit(actor_user_id,action,details)
  values(
    auth.uid(),'update_settings',
    jsonb_build_object(
      'enabled',coalesce(p_enabled,false),
      'points_per_brl',p_points_per_brl,
      'first_order_bonus_points',p_first_order_bonus_points,
      'birthday_multiplier',p_birthday_multiplier,
      'redemption_valid_days',p_redemption_valid_days,
      'max_points_per_order',p_max_points_per_order
    )
  );

  return (
    select to_jsonb(s) from public.padoka_loyalty_settings s where s.id=true
  );
end;
$$;

create or replace function padoka_rpc_private.admin_lookup_loyalty_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_role text;
  v_code text:=upper(trim(coalesce(p_code,'')));
  v_red public.padoka_loyalty_redemptions%rowtype;
  v_name text;
begin
  v_role:=padoka_private.loyalty_counter_role();

  if v_code !~ '^PDK-[A-F0-9]{12}$' then
    raise exception 'invalid redemption code';
  end if;

  select * into v_red
  from public.padoka_loyalty_redemptions r
  where r.code=v_code;

  if not found then
    raise exception 'redemption not found';
  end if;

  select left(coalesce(nullif(trim(p.full_name),''),'Cliente'),80)
    into v_name
  from public.padoka_profiles p
  where p.id=v_red.user_id;

  return jsonb_build_object(
    'id',v_red.id,
    'code',v_red.code,
    'reward_name',v_red.reward_name,
    'points_spent',v_red.points_spent,
    'status',v_red.status,
    'expires_at',v_red.expires_at,
    'created_at',v_red.created_at,
    'customer_name',coalesce(v_name,'Cliente')
  );
end;
$$;

create or replace function padoka_rpc_private.admin_process_loyalty_code(
  p_code text,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_role text;
  v_code text:=upper(trim(coalesce(p_code,'')));
  v_action text:=lower(trim(coalesce(p_action,'')));
  v_red public.padoka_loyalty_redemptions%rowtype;
  v_result jsonb;
begin
  v_role:=padoka_private.loyalty_counter_role();

  if v_code !~ '^PDK-[A-F0-9]{12}$' then
    raise exception 'invalid redemption code';
  end if;
  if v_action not in ('use','cancel') then
    raise exception 'invalid redemption action';
  end if;

  select * into v_red
  from public.padoka_loyalty_redemptions r
  where r.code=v_code
  for update;

  if not found then
    raise exception 'redemption not found';
  end if;

  if v_action='cancel' then
    v_result:=padoka_private.loyalty_refund_redemption(
      v_red.id,'cancelled',auth.uid(),'Cancelamento confirmado pela equipe'
    );
    insert into public.padoka_loyalty_admin_audit(
      actor_user_id,action,target_user_id,reward_id,redemption_id,details
    )
    values(
      auth.uid(),'cancel_redemption',v_red.user_id,v_red.reward_id,v_red.id,
      jsonb_build_object('code',v_code,'role',v_role)
    );
    return v_result;
  end if;

  if v_red.status<>'reserved' then
    raise exception 'redemption not available';
  end if;
  if v_red.expires_at<=now() then
    perform padoka_private.loyalty_refund_redemption(
      v_red.id,'expired',null,'Resgate expirado automaticamente'
    );
    raise exception 'redemption expired';
  end if;

  update public.padoka_loyalty_redemptions
     set status='used',
         used_at=now(),
         used_by=auth.uid()
   where id=v_red.id;

  insert into public.padoka_loyalty_admin_audit(
    actor_user_id,action,target_user_id,reward_id,redemption_id,details
  )
  values(
    auth.uid(),'use_redemption',v_red.user_id,v_red.reward_id,v_red.id,
    jsonb_build_object('code',v_code,'role',v_role)
  );

  insert into public.padoka_customer_notifications(user_id,kind,title,body)
  values(
    v_red.user_id,'loyalty','Recompensa utilizada',
    v_red.reward_name||' foi confirmada pela equipe da PADOKA.'
  );

  return jsonb_build_object(
    'id',v_red.id,'code',v_red.code,'status','used',
    'reward_name',v_red.reward_name,'used_at',now()
  );
end;
$$;

create or replace function padoka_private.expire_loyalty_redemptions()
returns integer
language plpgsql
security definer
set search_path=''
as $$
declare
  v_row record;
  v_count integer:=0;
begin
  for v_row in
    select r.id
    from public.padoka_loyalty_redemptions r
    where r.status='reserved' and r.expires_at<=now()
    order by r.expires_at
    for update skip locked
  loop
    perform padoka_private.loyalty_refund_redemption(
      v_row.id,'expired',null,'Resgate expirado automaticamente'
    );
    v_count:=v_count+1;
  end loop;
  return v_count;
end;
$$;

revoke all on function padoka_private.expire_loyalty_redemptions() from public,anon,authenticated;
grant execute on function padoka_private.expire_loyalty_redemptions() to service_role;

revoke all on function padoka_rpc_private.redeem_reward(uuid) from public,anon,authenticated;
revoke all on function padoka_rpc_private.cancel_redemption(uuid) from public,anon,authenticated;
revoke all on function padoka_rpc_private.admin_loyalty_customers(text,integer) from public,anon,authenticated;
revoke all on function padoka_rpc_private.admin_adjust_loyalty(uuid,integer,text) from public,anon,authenticated;
revoke all on function padoka_rpc_private.admin_upsert_loyalty_reward(uuid,text,text,integer,boolean,integer,integer,timestamptz,timestamptz,text,integer) from public,anon,authenticated;
revoke all on function padoka_rpc_private.admin_upsert_loyalty_campaign(uuid,text,text,numeric,integer,numeric,timestamptz,timestamptz,boolean) from public,anon,authenticated;
revoke all on function padoka_rpc_private.admin_update_loyalty_settings(boolean,numeric,integer,numeric,integer,integer) from public,anon,authenticated;
revoke all on function padoka_rpc_private.admin_lookup_loyalty_code(text) from public,anon,authenticated;
revoke all on function padoka_rpc_private.admin_process_loyalty_code(text,text) from public,anon,authenticated;

grant execute on function padoka_rpc_private.redeem_reward(uuid) to authenticated;
grant execute on function padoka_rpc_private.cancel_redemption(uuid) to authenticated;
grant execute on function padoka_rpc_private.admin_loyalty_customers(text,integer) to authenticated;
grant execute on function padoka_rpc_private.admin_adjust_loyalty(uuid,integer,text) to authenticated;
grant execute on function padoka_rpc_private.admin_upsert_loyalty_reward(uuid,text,text,integer,boolean,integer,integer,timestamptz,timestamptz,text,integer) to authenticated;
grant execute on function padoka_rpc_private.admin_upsert_loyalty_campaign(uuid,text,text,numeric,integer,numeric,timestamptz,timestamptz,boolean) to authenticated;
grant execute on function padoka_rpc_private.admin_update_loyalty_settings(boolean,numeric,integer,numeric,integer,integer) to authenticated;
grant execute on function padoka_rpc_private.admin_lookup_loyalty_code(text) to authenticated;
grant execute on function padoka_rpc_private.admin_process_loyalty_code(text,text) to authenticated;

create or replace function public.padoka_redeem_reward(p_reward_id uuid)
returns jsonb
language sql
security invoker
set search_path=''
as $$ select padoka_rpc_private.redeem_reward(p_reward_id); $$;

create or replace function public.padoka_cancel_loyalty_redemption(p_redemption_id uuid)
returns jsonb
language sql
security invoker
set search_path=''
as $$ select padoka_rpc_private.cancel_redemption(p_redemption_id); $$;

create or replace function public.padoka_admin_loyalty_customers(
  p_search text default '',
  p_limit integer default 50
)
returns table(
  user_id uuid,full_name text,email text,phone text,
  points_balance bigint,lifetime_points bigint,updated_at timestamptz
)
language sql
security invoker
set search_path=''
as $$
  select * from padoka_rpc_private.admin_loyalty_customers(p_search,p_limit);
$$;

create or replace function public.padoka_admin_adjust_loyalty(
  p_user_id uuid,p_points integer,p_reason text
)
returns jsonb
language sql
security invoker
set search_path=''
as $$
  select padoka_rpc_private.admin_adjust_loyalty(p_user_id,p_points,p_reason);
$$;

create or replace function public.padoka_admin_upsert_loyalty_reward(
  p_id uuid,p_name text,p_description text,p_points_cost integer,p_active boolean,
  p_stock_limit integer,p_per_customer_limit integer,p_valid_from timestamptz,
  p_valid_until timestamptz,p_badge text,p_sort_order integer
)
returns uuid
language sql
security invoker
set search_path=''
as $$
  select padoka_rpc_private.admin_upsert_loyalty_reward(
    p_id,p_name,p_description,p_points_cost,p_active,p_stock_limit,
    p_per_customer_limit,p_valid_from,p_valid_until,p_badge,p_sort_order
  );
$$;

create or replace function public.padoka_admin_upsert_loyalty_campaign(
  p_id uuid,p_name text,p_description text,p_multiplier numeric,p_bonus_points integer,
  p_min_order_total numeric,p_starts_at timestamptz,p_ends_at timestamptz,p_active boolean
)
returns uuid
language sql
security invoker
set search_path=''
as $$
  select padoka_rpc_private.admin_upsert_loyalty_campaign(
    p_id,p_name,p_description,p_multiplier,p_bonus_points,p_min_order_total,
    p_starts_at,p_ends_at,p_active
  );
$$;

create or replace function public.padoka_admin_update_loyalty_settings(
  p_enabled boolean,p_points_per_brl numeric,p_first_order_bonus_points integer,
  p_birthday_multiplier numeric,p_redemption_valid_days integer,p_max_points_per_order integer
)
returns jsonb
language sql
security invoker
set search_path=''
as $$
  select padoka_rpc_private.admin_update_loyalty_settings(
    p_enabled,p_points_per_brl,p_first_order_bonus_points,p_birthday_multiplier,
    p_redemption_valid_days,p_max_points_per_order
  );
$$;

create or replace function public.padoka_admin_lookup_loyalty_code(p_code text)
returns jsonb
language sql
security invoker
set search_path=''
as $$ select padoka_rpc_private.admin_lookup_loyalty_code(p_code); $$;

create or replace function public.padoka_admin_process_loyalty_code(p_code text,p_action text)
returns jsonb
language sql
security invoker
set search_path=''
as $$ select padoka_rpc_private.admin_process_loyalty_code(p_code,p_action); $$;

revoke all on function public.padoka_redeem_reward(uuid) from public,anon,authenticated;
revoke all on function public.padoka_cancel_loyalty_redemption(uuid) from public,anon,authenticated;
revoke all on function public.padoka_admin_loyalty_customers(text,integer) from public,anon,authenticated;
revoke all on function public.padoka_admin_adjust_loyalty(uuid,integer,text) from public,anon,authenticated;
revoke all on function public.padoka_admin_upsert_loyalty_reward(uuid,text,text,integer,boolean,integer,integer,timestamptz,timestamptz,text,integer) from public,anon,authenticated;
revoke all on function public.padoka_admin_upsert_loyalty_campaign(uuid,text,text,numeric,integer,numeric,timestamptz,timestamptz,boolean) from public,anon,authenticated;
revoke all on function public.padoka_admin_update_loyalty_settings(boolean,numeric,integer,numeric,integer,integer) from public,anon,authenticated;
revoke all on function public.padoka_admin_lookup_loyalty_code(text) from public,anon,authenticated;
revoke all on function public.padoka_admin_process_loyalty_code(text,text) from public,anon,authenticated;

grant execute on function public.padoka_redeem_reward(uuid) to authenticated;
grant execute on function public.padoka_cancel_loyalty_redemption(uuid) to authenticated;
grant execute on function public.padoka_admin_loyalty_customers(text,integer) to authenticated;
grant execute on function public.padoka_admin_adjust_loyalty(uuid,integer,text) to authenticated;
grant execute on function public.padoka_admin_upsert_loyalty_reward(uuid,text,text,integer,boolean,integer,integer,timestamptz,timestamptz,text,integer) to authenticated;
grant execute on function public.padoka_admin_upsert_loyalty_campaign(uuid,text,text,numeric,integer,numeric,timestamptz,timestamptz,boolean) to authenticated;
grant execute on function public.padoka_admin_update_loyalty_settings(boolean,numeric,integer,numeric,integer,integer) to authenticated;
grant execute on function public.padoka_admin_lookup_loyalty_code(text) to authenticated;
grant execute on function public.padoka_admin_process_loyalty_code(text,text) to authenticated;

create or replace function public.padoka_export_my_data()
returns jsonb
language plpgsql
stable
security invoker
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_result jsonb;
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
    'loyalty_ledger',coalesce((
      select jsonb_agg(to_jsonb(l) order by l.created_at desc)
      from public.padoka_loyalty_ledger l where l.user_id=v_uid
    ),'[]'::jsonb),
    'loyalty_redemptions',coalesce((
      select jsonb_agg(to_jsonb(r) order by r.created_at desc)
      from public.padoka_loyalty_redemptions r where r.user_id=v_uid
    ),'[]'::jsonb),
    'notifications',coalesce((
      select jsonb_agg(to_jsonb(n) order by n.created_at desc)
      from public.padoka_customer_notifications n where n.user_id=v_uid
    ),'[]'::jsonb),
    'privacy_requests',coalesce((
      select jsonb_agg(to_jsonb(r) order by r.created_at desc)
      from public.padoka_privacy_requests r where r.user_id=v_uid
    ),'[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;
revoke all on function public.padoka_export_my_data() from public,anon;
grant execute on function public.padoka_export_my_data() to authenticated;

update public.padoka_feature_flags
set enabled=true,
    config=jsonb_build_object(
      'points_per_real',1,
      'first_order_bonus_points',20,
      'birthday_multiplier',2,
      'redemption_valid_days',30
    ),
    updated_at=now()
where key='loyalty';

do $$
declare v_jobid bigint;
begin
  for v_jobid in
    select jobid from cron.job where jobname='padoka-loyalty-expire-redemptions'
  loop
    perform cron.unschedule(v_jobid);
  end loop;
end
$$;

select cron.schedule(
  'padoka-loyalty-expire-redemptions',
  '*/30 * * * *',
  'select padoka_private.expire_loyalty_redemptions();'
);
