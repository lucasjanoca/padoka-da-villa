-- PADOKA DA VILLA — keep customer privacy requests server-authoritative.
-- The browser may request an action through the RPC, but cannot INSERT directly
-- into padoka_privacy_requests.

create unique index if not exists padoka_privacy_requests_one_active_type_uidx
  on public.padoka_privacy_requests(user_id, request_type)
  where status in ('pending','in_progress');

create or replace function padoka_rpc_private.request_privacy_action(
  p_type text,
  p_details text default null
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid := auth.uid();
  v_id uuid;
  v_details text;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  if p_type not in ('export','delete','correct') then
    raise exception 'invalid request type';
  end if;

  if p_details is not null and char_length(p_details) > 600 then
    raise exception 'details too long';
  end if;

  v_details := nullif(trim(p_details), '');

  begin
    insert into public.padoka_privacy_requests(user_id, request_type, details)
    values(v_user_id, p_type, v_details)
    returning id into v_id;
  exception
    when unique_violation then
      raise exception 'request already pending';
  end;

  return v_id;
end;
$$;

revoke all on function padoka_rpc_private.request_privacy_action(text,text) from public,anon,authenticated;
grant execute on function padoka_rpc_private.request_privacy_action(text,text) to authenticated;

create or replace function public.padoka_request_privacy_action(
  p_type text,
  p_details text default null
)
returns uuid
language sql
security invoker
set search_path=''
as $$
  select padoka_rpc_private.request_privacy_action(p_type,p_details);
$$;

revoke all on function public.padoka_request_privacy_action(text,text) from public,anon,authenticated;
grant execute on function public.padoka_request_privacy_action(text,text) to authenticated;

alter table public.padoka_privacy_requests enable row level security;
revoke insert on table public.padoka_privacy_requests from public,anon,authenticated;
revoke insert(user_id,request_type,details) on table public.padoka_privacy_requests from public,anon,authenticated;
drop policy if exists padoka_privacy_own_insert on public.padoka_privacy_requests;
