
create or replace function padoka_private.padoka_security_self_check()
returns jsonb
language plpgsql
security definer
set search_path=''
as $fn$
declare
  v_issues jsonb := '[]'::jsonb;
  v_bad_tables jsonb;
  v_bad_functions jsonb;
  v_fingerprint text := md5('padoka-security-self-check');
  v_now timestamptz := now();
begin
  select coalesce(jsonb_agg(c.relname order by c.relname),'[]'::jsonb)
    into v_bad_tables
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public'
    and c.relkind='r'
    and c.relname like 'padoka_%'
    and not c.relrowsecurity;

  if jsonb_array_length(v_bad_tables)>0 then
    v_issues := v_issues || jsonb_build_array(jsonb_build_object('check','rls_enabled','tables',v_bad_tables));
  end if;

  select coalesce(jsonb_agg(p.proname order by p.proname),'[]'::jsonb)
    into v_bad_functions
  from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.proname like 'padoka_%'
    and p.prosecdef
    and pg_catalog.has_function_privilege('authenticated',p.oid,'EXECUTE');

  if jsonb_array_length(v_bad_functions)>0 then
    v_issues := v_issues || jsonb_build_array(jsonb_build_object('check','public_security_definer_exposure','functions',v_bad_functions));
  end if;

  if pg_catalog.has_schema_privilege('anon','public','CREATE')
     or pg_catalog.has_schema_privilege('authenticated','public','CREATE') then
    v_issues := v_issues || jsonb_build_array(jsonb_build_object(
      'check','public_schema_create',
      'anon',pg_catalog.has_schema_privilege('anon','public','CREATE'),
      'authenticated',pg_catalog.has_schema_privilege('authenticated','public','CREATE')
    ));
  end if;

  if exists(
    select 1 from information_schema.columns
    where table_schema='public' and table_name='padoka_push_config' and column_name='vapid_private_key'
  ) then
    v_issues := v_issues || jsonb_build_array(jsonb_build_object('check','vapid_private_key_public_schema'));
  end if;

  if pg_catalog.has_table_privilege('anon','public.padoka_push_subscriptions','SELECT')
     or pg_catalog.has_table_privilege('authenticated','public.padoka_push_subscriptions','SELECT') then
    v_issues := v_issues || jsonb_build_array(jsonb_build_object('check','push_subscriptions_client_read'));
  end if;

  if pg_catalog.has_function_privilege('anon','public.padoka_get_push_server_config()','EXECUTE')
     or pg_catalog.has_function_privilege('authenticated','public.padoka_get_push_server_config()','EXECUTE') then
    v_issues := v_issues || jsonb_build_array(jsonb_build_object('check','push_server_secret_rpc_exposed'));
  end if;

  if pg_catalog.has_schema_privilege('anon','padoka_rpc_private','USAGE') then
    v_issues := v_issues || jsonb_build_array(jsonb_build_object('check','private_rpc_schema_anon_usage'));
  end if;

  if pg_catalog.has_function_privilege('anon','public.padoka_admin_resolve_incident(uuid)','EXECUTE')
     or pg_catalog.has_function_privilege('anon','public.padoka_admin_set_feature_flag(text,boolean)','EXECUTE')
     or pg_catalog.has_function_privilege('anon','public.padoka_admin_update_privacy_request(uuid,text,text)','EXECUTE') then
    v_issues := v_issues || jsonb_build_array(jsonb_build_object('check','enterprise_admin_rpc_anon_execute'));
  end if;

  if pg_catalog.has_column_privilege('authenticated','public.padoka_feature_flags','enabled','UPDATE')
     or pg_catalog.has_column_privilege('authenticated','public.padoka_incidents','status','UPDATE')
     or pg_catalog.has_column_privilege('authenticated','public.padoka_privacy_requests','status','UPDATE')
     or pg_catalog.has_column_privilege('authenticated','public.padoka_privacy_requests','resolution_note','UPDATE') then
    v_issues := v_issues || jsonb_build_array(jsonb_build_object('check','sensitive_direct_update_restored'));
  end if;

  if exists(
    select 1
    from information_schema.role_column_grants
    where table_schema='public'
      and table_name='padoka_production_plans'
      and grantee='authenticated'
      and privilege_type in ('INSERT','UPDATE','DELETE')
  ) then
    v_issues := v_issues || jsonb_build_array(jsonb_build_object('check','production_plan_direct_write_restored'));
  end if;

  if jsonb_array_length(v_issues)>0 then
    insert into public.padoka_incidents(
      fingerprint,severity,status,source,title,occurrence_count,
      first_seen_at,last_seen_at,sample,resolved_at,resolved_by
    )
    values(
      v_fingerprint,'critical','open','database','PADOKA security self-check failed',1,
      v_now,v_now,jsonb_build_object('issues',v_issues,'checked_at',v_now),null,null
    )
    on conflict (fingerprint) do update
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

  return jsonb_build_object('ok',jsonb_array_length(v_issues)=0,'issues',v_issues,'checked_at',v_now);
end;
$fn$;

revoke all on function padoka_private.padoka_security_self_check() from public,anon,authenticated;
grant execute on function padoka_private.padoka_security_self_check() to service_role;
