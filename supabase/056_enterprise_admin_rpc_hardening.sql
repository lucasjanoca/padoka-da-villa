
create schema if not exists padoka_rpc_private;
revoke all on schema padoka_rpc_private from public,anon,authenticated;
grant usage on schema padoka_rpc_private to authenticated;

create or replace function padoka_rpc_private.admin_resolve_incident(p_incident_id uuid)
returns table(id uuid,status text,resolved_at timestamptz,resolved_by uuid)
language plpgsql
security definer
set search_path=''
as $$
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if coalesce(auth.jwt()->>'aal','aal1') <> 'aal2' then raise exception 'mfa required'; end if;
  if not padoka_private.staff_has_role(array['owner','manager']) then raise exception 'permission required'; end if;
  if not exists(select 1 from public.padoka_incidents i where i.id=p_incident_id) then raise exception 'incident not found'; end if;

  update public.padoka_incidents i
     set status='resolved',
         resolved_at=coalesce(i.resolved_at,now()),
         resolved_by=coalesce(i.resolved_by,auth.uid())
   where i.id=p_incident_id;

  return query
  select i.id,i.status,i.resolved_at,i.resolved_by
    from public.padoka_incidents i
   where i.id=p_incident_id;
end;
$$;

create or replace function padoka_rpc_private.admin_set_feature_flag(p_key text,p_enabled boolean)
returns table(key text,enabled boolean,updated_at timestamptz,updated_by uuid)
language plpgsql
security definer
set search_path=''
as $$
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if coalesce(auth.jwt()->>'aal','aal1') <> 'aal2' then raise exception 'mfa required'; end if;
  if not padoka_private.staff_has_role(array['owner','manager']) then raise exception 'permission required'; end if;
  if p_key is null or char_length(trim(p_key))<1 or char_length(trim(p_key))>80 then raise exception 'invalid feature flag'; end if;

  update public.padoka_feature_flags f
     set enabled=p_enabled,
         updated_at=now(),
         updated_by=auth.uid()
   where f.key=trim(p_key);

  if not found then raise exception 'feature flag not found'; end if;

  return query
  select f.key,f.enabled,f.updated_at,f.updated_by
    from public.padoka_feature_flags f
   where f.key=trim(p_key);
end;
$$;

create or replace function padoka_rpc_private.admin_update_privacy_request(
  p_request_id uuid,
  p_status text,
  p_resolution_note text default null
)
returns table(id uuid,status text,resolution_note text,updated_at timestamptz,completed_at timestamptz,handled_by uuid)
language plpgsql
security definer
set search_path=''
as $$
declare
  v_status text:=lower(trim(coalesce(p_status,'')));
  v_note text:=nullif(trim(coalesce(p_resolution_note,'')),'');
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if coalesce(auth.jwt()->>'aal','aal1') <> 'aal2' then raise exception 'mfa required'; end if;
  if not padoka_private.staff_has_role(array['owner']) then raise exception 'permission required'; end if;
  if v_status not in ('in_progress','completed','rejected') then raise exception 'invalid privacy status'; end if;
  if v_note is not null and char_length(v_note)>600 then raise exception 'resolution note too long'; end if;
  if not exists(select 1 from public.padoka_privacy_requests r where r.id=p_request_id) then raise exception 'privacy request not found'; end if;

  update public.padoka_privacy_requests r
     set status=v_status,
         resolution_note=case when v_status='in_progress' then r.resolution_note else v_note end,
         updated_at=now(),
         completed_at=case when v_status in ('completed','rejected') then coalesce(r.completed_at,now()) else null end,
         handled_by=auth.uid()
   where r.id=p_request_id;

  return query
  select r.id,r.status,r.resolution_note,r.updated_at,r.completed_at,r.handled_by
    from public.padoka_privacy_requests r
   where r.id=p_request_id;
end;
$$;

revoke all on function padoka_rpc_private.admin_resolve_incident(uuid) from public,anon,authenticated;
revoke all on function padoka_rpc_private.admin_set_feature_flag(text,boolean) from public,anon,authenticated;
revoke all on function padoka_rpc_private.admin_update_privacy_request(uuid,text,text) from public,anon,authenticated;
grant execute on function padoka_rpc_private.admin_resolve_incident(uuid) to authenticated;
grant execute on function padoka_rpc_private.admin_set_feature_flag(text,boolean) to authenticated;
grant execute on function padoka_rpc_private.admin_update_privacy_request(uuid,text,text) to authenticated;

create or replace function public.padoka_admin_resolve_incident(p_incident_id uuid)
returns table(id uuid,status text,resolved_at timestamptz,resolved_by uuid)
language sql
security invoker
set search_path=''
as $$ select * from padoka_rpc_private.admin_resolve_incident(p_incident_id); $$;

create or replace function public.padoka_admin_set_feature_flag(p_key text,p_enabled boolean)
returns table(key text,enabled boolean,updated_at timestamptz,updated_by uuid)
language sql
security invoker
set search_path=''
as $$ select * from padoka_rpc_private.admin_set_feature_flag(p_key,p_enabled); $$;

create or replace function public.padoka_admin_update_privacy_request(
  p_request_id uuid,
  p_status text,
  p_resolution_note text default null
)
returns table(id uuid,status text,resolution_note text,updated_at timestamptz,completed_at timestamptz,handled_by uuid)
language sql
security invoker
set search_path=''
as $$ select * from padoka_rpc_private.admin_update_privacy_request(p_request_id,p_status,p_resolution_note); $$;

revoke all on function public.padoka_admin_resolve_incident(uuid) from public,anon,authenticated;
revoke all on function public.padoka_admin_set_feature_flag(text,boolean) from public,anon,authenticated;
revoke all on function public.padoka_admin_update_privacy_request(uuid,text,text) from public,anon,authenticated;
grant execute on function public.padoka_admin_resolve_incident(uuid) to authenticated;
grant execute on function public.padoka_admin_set_feature_flag(text,boolean) to authenticated;
grant execute on function public.padoka_admin_update_privacy_request(uuid,text,text) to authenticated;

revoke update(enabled,description,config) on table public.padoka_feature_flags from authenticated;
revoke update(status) on table public.padoka_incidents from authenticated;
revoke update(status,resolution_note) on table public.padoka_privacy_requests from authenticated;
