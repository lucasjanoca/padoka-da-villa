-- PADOKA DA VILLA — resgate idempotente do PADOKA Club
-- Evita desconto duplicado quando a resposta da rede é ambígua.

alter table public.padoka_loyalty_redemptions
  add column if not exists request_id uuid;

create unique index if not exists padoka_loyalty_redemptions_user_request_uidx
  on public.padoka_loyalty_redemptions(user_id, request_id)
  where request_id is not null;

create or replace function padoka_rpc_private.redeem_reward_once(
  p_reward_id uuid,
  p_request_id uuid
)
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
  v_existing public.padoka_loyalty_redemptions%rowtype;
  v_existing_balance bigint;
begin
  v_uid:=padoka_private.padoka_loyalty_require_customer();

  if p_request_id is null then
    raise exception 'request id required';
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

  select * into v_existing
  from public.padoka_loyalty_redemptions r
  where r.user_id=v_uid
    and r.request_id=p_request_id;

  if found then
    if v_existing.reward_id<>p_reward_id then
      raise exception 'request id conflict';
    end if;

    select l.balance_after into v_existing_balance
    from public.padoka_loyalty_ledger l
    where l.redemption_id=v_existing.id
      and l.entry_type='redeem'
    order by l.created_at asc
    limit 1;

    return jsonb_build_object(
      'id',v_existing.id,
      'code',v_existing.code,
      'reward_name',v_existing.reward_name,
      'points_spent',v_existing.points_spent,
      'status',v_existing.status,
      'expires_at',v_existing.expires_at,
      'balance_after',coalesce(v_existing_balance,v_balance),
      'replayed',true
    );
  end if;

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
    user_id,reward_id,code,reward_name,points_spent,expires_at,request_id
  )
  values(v_uid,v_reward.id,v_code,v_reward.name,v_reward.points_cost,v_expires,p_request_id)
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
    'expires_at',v_expires,'balance_after',v_balance-v_reward.points_cost,
    'replayed',false
  );
end;
$$;

revoke all on function padoka_rpc_private.redeem_reward_once(uuid,uuid)
from public,anon,authenticated;
grant execute on function padoka_rpc_private.redeem_reward_once(uuid,uuid)
to authenticated;

create or replace function public.padoka_redeem_reward_once(
  p_reward_id uuid,
  p_request_id uuid
)
returns jsonb
language sql
security invoker
set search_path=''
as $$
  select padoka_rpc_private.redeem_reward_once(p_reward_id,p_request_id);
$$;

revoke all on function public.padoka_redeem_reward_once(uuid,uuid)
from public,anon,authenticated;
grant execute on function public.padoka_redeem_reward_once(uuid,uuid)
to authenticated;

-- O caminho antigo não é seguro para retry ambíguo: falhar fechado é preferível.
revoke execute on function public.padoka_redeem_reward(uuid)
from public,anon,authenticated;
revoke execute on function padoka_rpc_private.redeem_reward(uuid)
from public,anon,authenticated;
