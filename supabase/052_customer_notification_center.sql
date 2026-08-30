
create index if not exists padoka_customer_notifications_user_created_idx
  on public.padoka_customer_notifications(user_id, created_at desc);

revoke update on table public.padoka_customer_notifications from authenticated;
grant update(read_at) on table public.padoka_customer_notifications to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname='supabase_realtime'
      and schemaname='public'
      and tablename='padoka_customer_notifications'
  ) then
    alter publication supabase_realtime add table public.padoka_customer_notifications;
  end if;
end
$$;
