-- PADOKA DA VILLA — isolamento do PADOKA Club no Supabase compartilhado
-- Clientes do Club precisam ter concluído o onboarding da PADOKA (padoka_profiles).
-- Staff continua isolado por padoka_staff_users através de staff_has_role().

create or replace function padoka_private.padoka_loyalty_require_customer()
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode='42501';
  end if;

  if not exists(
    select 1
    from public.padoka_profiles p
    where p.id=v_uid
  ) then
    raise exception 'PADOKA onboarding required' using errcode='42501';
  end if;

  return v_uid;
end;
$$;
revoke all on function padoka_private.padoka_loyalty_require_customer()
from public,anon,authenticated;

alter table public.padoka_loyalty_accounts enable row level security;
alter table public.padoka_loyalty_ledger enable row level security;
alter table public.padoka_loyalty_settings enable row level security;
alter table public.padoka_loyalty_rewards enable row level security;
alter table public.padoka_loyalty_campaigns enable row level security;
alter table public.padoka_loyalty_redemptions enable row level security;

drop policy if exists padoka_loyalty_account_own_read on public.padoka_loyalty_accounts;
create policy padoka_loyalty_account_own_read
on public.padoka_loyalty_accounts
for select to authenticated
using (
  (
    user_id=(select auth.uid())
    and exists(
      select 1 from public.padoka_profiles p
      where p.id=(select auth.uid())
    )
  )
  or (select padoka_private.staff_has_role(array['owner','manager']))
);

drop policy if exists padoka_loyalty_ledger_own_read on public.padoka_loyalty_ledger;
create policy padoka_loyalty_ledger_own_read
on public.padoka_loyalty_ledger
for select to authenticated
using (
  (
    user_id=(select auth.uid())
    and exists(
      select 1 from public.padoka_profiles p
      where p.id=(select auth.uid())
    )
  )
  or (select padoka_private.staff_has_role(array['owner','manager']))
);

drop policy if exists padoka_loyalty_settings_read on public.padoka_loyalty_settings;
create policy padoka_loyalty_settings_read
on public.padoka_loyalty_settings
for select to authenticated
using (
  exists(
    select 1 from public.padoka_profiles p
    where p.id=(select auth.uid())
  )
  or (select padoka_private.staff_has_role(array['owner','manager','cashier','attendant']))
);

drop policy if exists padoka_loyalty_rewards_read on public.padoka_loyalty_rewards;
create policy padoka_loyalty_rewards_read
on public.padoka_loyalty_rewards
for select to authenticated
using (
  (
    active=true
    and exists(
      select 1 from public.padoka_profiles p
      where p.id=(select auth.uid())
    )
  )
  or (select padoka_private.staff_has_role(array['owner','manager','cashier','attendant']))
);

drop policy if exists padoka_loyalty_campaigns_read on public.padoka_loyalty_campaigns;
create policy padoka_loyalty_campaigns_read
on public.padoka_loyalty_campaigns
for select to authenticated
using (
  (
    active=true
    and exists(
      select 1 from public.padoka_profiles p
      where p.id=(select auth.uid())
    )
  )
  or (select padoka_private.staff_has_role(array['owner','manager']))
);

drop policy if exists padoka_loyalty_redemptions_read on public.padoka_loyalty_redemptions;
create policy padoka_loyalty_redemptions_read
on public.padoka_loyalty_redemptions
for select to authenticated
using (
  (
    user_id=(select auth.uid())
    and exists(
      select 1 from public.padoka_profiles p
      where p.id=(select auth.uid())
    )
  )
  or (select padoka_private.staff_has_role(array['owner','manager']))
);

create or replace function padoka_rpc_private.redeem_reward(p_reward_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid;
  v_reward public.padoka_loyalty_rewards%rowtype;
  v_settings public.padoka_loyalty_settings%rowtype;
  v_balance bigint;
  v_count integer;
  v_code text;
  v_expires timestamptz;
  v_id uuid;
begin
  v_uid:=padoka_private.padoka_loyalty_require_customer();

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

  if not found or not v_reward.active then raise exception 'reward unavailable'; end if;
  if v_reward.valid_from is not null and now()<v_reward.valid_from then raise exception 'reward not started'; end if;
  if v_reward.valid_until is not null and now()>=v_reward.valid_until then raise exception 'reward expired'; end if;
  if v_reward.stock_limit is not null and v_reward.stock_redeemed>=v_reward.stock_limit then raise exception 'reward out of stock'; end if;

  insert into public.padoka_loyalty_accounts(user_id,points_balance,lifetime_points)
  values(v_uid,0,0)
  on conflict (user_id) do nothing;

  select a.points_balance into v_balance
  from public.padoka_loyalty_accounts a
  where a.user_id=v_uid
  for update;

  if v_balance < v_reward.points_cost then raise exception 'insufficient points'; end if;

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

  v_expires:=now()+make_interval(days=>v_settings.redemption_valid_days);
  if v_reward.valid_until is not null then
    v_expires:=least(v_expires,v_reward.valid_until);
  end if;
  if v_expires<=now() then raise exception 'reward expired'; end if;

  loop
    v_code:='PDK-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
    exit when not exists(
      select 1 from public.padoka_loyalty_redemptions r where r.code=v_code
    );
  end loop;

  insert into public.padoka_loyalty_redemptions(
    user_id,reward_id,code,reward_name,points_spent,expires_at
  )
  values(v_uid,v_reward.id,v_code,v_reward.name,v_reward.points_cost,v_expires)
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
    'id',v_id,'code',v_code,'reward_name',v_reward.name,
    'points_spent',v_reward.points_cost,'status','reserved',
    'expires_at',v_expires,'balance_after',v_balance-v_reward.points_cost
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
  v_uid uuid;
  v_owner uuid;
begin
  v_uid:=padoka_private.padoka_loyalty_require_customer();

  select r.user_id into v_owner
  from public.padoka_loyalty_redemptions r
  where r.id=p_redemption_id;

  if v_owner is null then raise exception 'redemption not found'; end if;
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
    p.id,
    left(coalesce(nullif(trim(p.full_name),''),split_part(coalesce(u.email,''),'@',1),'Cliente'),80),
    left(coalesce(u.email,''),254),
    left(coalesce(p.phone,''),40),
    coalesce(a.points_balance,0),
    coalesce(a.lifetime_points,0),
    coalesce(a.updated_at,p.updated_at,u.updated_at)
  from public.padoka_profiles p
  join auth.users u on u.id=p.id
  left join public.padoka_loyalty_accounts a on a.user_id=p.id
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
  if not exists(
    select 1 from public.padoka_profiles p where p.id=p_user_id
  ) then
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
  if v_new_balance<0 then raise exception 'insufficient customer balance'; end if;

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
    jsonb_build_object(
      'reason',v_reason,
      'balance_before',v_balance,
      'balance_after',v_new_balance
    )
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