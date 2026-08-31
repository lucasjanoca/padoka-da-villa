create or replace function padoka_rpc_private.mark_customer_notifications_read(p_notification_id uuid default null)
returns integer
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
  v_count integer;
begin
  if v_user_id is null then raise exception 'authentication required'; end if;

  update public.padoka_customer_notifications n
     set read_at=coalesce(n.read_at,now())
   where n.user_id=v_user_id
     and n.read_at is null
     and (p_notification_id is null or n.id=p_notification_id);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function padoka_rpc_private.mark_customer_notifications_read(uuid) from public,anon,authenticated;
grant execute on function padoka_rpc_private.mark_customer_notifications_read(uuid) to authenticated;

create or replace function public.padoka_mark_customer_notifications_read(p_notification_id uuid default null)
returns integer
language sql
security invoker
set search_path=''
as $$ select padoka_rpc_private.mark_customer_notifications_read(p_notification_id); $$;

revoke all on function public.padoka_mark_customer_notifications_read(uuid) from public,anon,authenticated;
grant execute on function public.padoka_mark_customer_notifications_read(uuid) to authenticated;

revoke update on table public.padoka_customer_notifications from anon,authenticated;
revoke update(read_at) on table public.padoka_customer_notifications from anon,authenticated;
drop policy if exists padoka_customer_notifications_own_update on public.padoka_customer_notifications;
