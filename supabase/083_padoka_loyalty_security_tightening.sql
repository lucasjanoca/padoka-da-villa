
-- PADOKA DA VILLA — hardening complementar do PADOKA Club

revoke select on table public.padoka_loyalty_settings from authenticated;
grant select(
  id,enabled,points_per_brl,first_order_bonus_points,birthday_multiplier,
  redemption_valid_days,max_points_per_order,updated_at
) on table public.padoka_loyalty_settings to authenticated;

revoke select on table public.padoka_loyalty_rewards from authenticated;
grant select(
  id,name,description,points_cost,active,stock_limit,stock_redeemed,
  per_customer_limit,valid_from,valid_until,badge,sort_order,created_at,updated_at
) on table public.padoka_loyalty_rewards to authenticated;

revoke select on table public.padoka_loyalty_campaigns from authenticated;
grant select(
  id,name,description,multiplier,bonus_points,min_order_total,
  starts_at,ends_at,active,created_at,updated_at
) on table public.padoka_loyalty_campaigns to authenticated;

revoke select on table public.padoka_loyalty_redemptions from authenticated;
grant select(
  id,user_id,reward_id,code,reward_name,points_spent,status,
  expires_at,used_at,cancelled_at,created_at
) on table public.padoka_loyalty_redemptions to authenticated;

revoke select on table public.padoka_loyalty_ledger from authenticated;
grant select(
  id,user_id,order_id,entry_type,points,description,created_at,
  source,balance_after,campaign_id,redemption_id
) on table public.padoka_loyalty_ledger to authenticated;

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
    v_result:=padoka_private.loyalty_refund_redemption(
      v_red.id,'expired',null,'Resgate expirado automaticamente'
    );
    return v_result || jsonb_build_object(
      'code',v_red.code,
      'reward_name',v_red.reward_name
    );
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
      select jsonb_agg(
        jsonb_build_object(
          'id',l.id,'order_id',l.order_id,'entry_type',l.entry_type,
          'points',l.points,'description',l.description,'source',l.source,
          'balance_after',l.balance_after,'campaign_id',l.campaign_id,
          'redemption_id',l.redemption_id,'created_at',l.created_at
        )
        order by l.created_at desc
      )
      from public.padoka_loyalty_ledger l where l.user_id=v_uid
    ),'[]'::jsonb),
    'loyalty_redemptions',coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id',r.id,'reward_id',r.reward_id,'code',r.code,
          'reward_name',r.reward_name,'points_spent',r.points_spent,
          'status',r.status,'expires_at',r.expires_at,'used_at',r.used_at,
          'cancelled_at',r.cancelled_at,'created_at',r.created_at
        )
        order by r.created_at desc
      )
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

create or replace function padoka_private.padoka_loyalty_security_check()
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_issues jsonb:='[]'::jsonb;
  v_now timestamptz:=now();
  v_fingerprint text:=md5('padoka-loyalty-security-check');
begin
  if exists(
    select 1
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public'
      and c.relname in (
        'padoka_loyalty_accounts','padoka_loyalty_ledger','padoka_loyalty_settings',
        'padoka_loyalty_rewards','padoka_loyalty_campaigns',
        'padoka_loyalty_redemptions','padoka_loyalty_admin_audit'
      )
      and not c.relrowsecurity
  ) then
    v_issues:=v_issues||jsonb_build_array(jsonb_build_object('check','loyalty_rls_disabled'));
  end if;

  if exists(
    select 1
    from (values
      ('padoka_loyalty_accounts'),
      ('padoka_loyalty_ledger'),
      ('padoka_loyalty_settings'),
      ('padoka_loyalty_rewards'),
      ('padoka_loyalty_campaigns'),
      ('padoka_loyalty_redemptions'),
      ('padoka_loyalty_admin_audit')
    ) as t(name)
    where pg_catalog.has_table_privilege('anon','public.'||t.name,'INSERT')
       or pg_catalog.has_table_privilege('anon','public.'||t.name,'UPDATE')
       or pg_catalog.has_table_privilege('anon','public.'||t.name,'DELETE')
       or pg_catalog.has_table_privilege('authenticated','public.'||t.name,'INSERT')
       or pg_catalog.has_table_privilege('authenticated','public.'||t.name,'UPDATE')
       or pg_catalog.has_table_privilege('authenticated','public.'||t.name,'DELETE')
  ) then
    v_issues:=v_issues||jsonb_build_array(jsonb_build_object('check','loyalty_direct_write_exposed'));
  end if;

  if pg_catalog.has_function_privilege('anon','public.padoka_redeem_reward(uuid)','EXECUTE')
     or pg_catalog.has_function_privilege('anon','public.padoka_cancel_loyalty_redemption(uuid)','EXECUTE')
     or pg_catalog.has_function_privilege('anon','public.padoka_admin_adjust_loyalty(uuid,integer,text)','EXECUTE')
     or pg_catalog.has_function_privilege('anon','public.padoka_admin_process_loyalty_code(text,text)','EXECUTE') then
    v_issues:=v_issues||jsonb_build_array(jsonb_build_object('check','loyalty_rpc_anon_execute'));
  end if;

  if pg_catalog.has_function_privilege(
       'authenticated','padoka_private.padoka_award_loyalty_on_real_order()','EXECUTE'
     )
     or pg_catalog.has_function_privilege(
       'authenticated','padoka_private.loyalty_refund_redemption(uuid,text,uuid,text)','EXECUTE'
     )
     or pg_catalog.has_function_privilege(
       'authenticated','padoka_private.expire_loyalty_redemptions()','EXECUTE'
     ) then
    v_issues:=v_issues||jsonb_build_array(jsonb_build_object('check','loyalty_private_helper_exposed'));
  end if;

  if not exists(
    select 1 from pg_catalog.pg_trigger tg
    join pg_catalog.pg_class c on c.oid=tg.tgrelid
    join pg_catalog.pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public'
      and c.relname='padoka_orders'
      and tg.tgname='padoka_award_loyalty_on_real_order_trg'
      and not tg.tgisinternal
  ) then
    v_issues:=v_issues||jsonb_build_array(jsonb_build_object('check','loyalty_award_trigger_missing'));
  end if;

  if pg_catalog.has_column_privilege(
       'authenticated','public.padoka_loyalty_ledger','actor_user_id','SELECT'
     )
     or pg_catalog.has_column_privilege(
       'authenticated','public.padoka_loyalty_redemptions','used_by','SELECT'
     )
     or pg_catalog.has_column_privilege(
       'authenticated','public.padoka_loyalty_rewards','updated_by','SELECT'
     ) then
    v_issues:=v_issues||jsonb_build_array(jsonb_build_object('check','loyalty_internal_ids_exposed'));
  end if;

  if jsonb_array_length(v_issues)>0 then
    insert into public.padoka_incidents(
      fingerprint,severity,status,source,title,occurrence_count,
      first_seen_at,last_seen_at,sample,resolved_at,resolved_by
    )
    values(
      v_fingerprint,'critical','open','database',
      'PADOKA Club security check failed',1,
      v_now,v_now,jsonb_build_object('issues',v_issues,'checked_at',v_now),null,null
    )
    on conflict(fingerprint) do update
      set severity='critical',
          status='open',
          occurrence_count=public.padoka_incidents.occurrence_count+1,
          last_seen_at=v_now,
          sample=jsonb_build_object('issues',v_issues,'checked_at',v_now),
          resolved_at=null,
          resolved_by=null;
  else
    update public.padoka_incidents
       set status='resolved',
           resolved_at=coalesce(resolved_at,v_now),
           resolved_by=null,
           last_seen_at=v_now,
           sample=jsonb_build_object('issues','[]'::jsonb,'checked_at',v_now)
     where fingerprint=v_fingerprint
       and status is distinct from 'resolved';
  end if;

  return jsonb_build_object(
    'ok',jsonb_array_length(v_issues)=0,
    'issues',v_issues,
    'checked_at',v_now
  );
end;
$$;

revoke all on function padoka_private.padoka_loyalty_security_check()
from public,anon,authenticated;
grant execute on function padoka_private.padoka_loyalty_security_check() to service_role;

do $$
declare v_jobid bigint;
begin
  for v_jobid in
    select jobid from cron.job where jobname='padoka-loyalty-security-check-hourly'
  loop
    perform cron.unschedule(v_jobid);
  end loop;
end
$$;

select cron.schedule(
  'padoka-loyalty-security-check-hourly',
  '17 * * * *',
  'select padoka_private.padoka_loyalty_security_check();'
);
