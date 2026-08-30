
create extension if not exists pg_cron;

create or replace function padoka_private.padoka_housekeeping()
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_events integer := 0;
  v_incidents integer := 0;
  v_push integer := 0;
begin
  delete from public.padoka_client_events
  where created_at < now() - interval '90 days';
  get diagnostics v_events = row_count;

  delete from public.padoka_incidents
  where status = 'resolved'
    and coalesce(resolved_at,last_seen_at) < now() - interval '180 days';
  get diagnostics v_incidents = row_count;

  delete from public.padoka_push_subscriptions
  where coalesce(last_seen_at,updated_at,created_at) < now() - interval '180 days';
  get diagnostics v_push = row_count;

  return jsonb_build_object(
    'client_events_deleted',v_events,
    'resolved_incidents_deleted',v_incidents,
    'stale_push_subscriptions_deleted',v_push,
    'finished_at',now()
  );
end;
$$;

revoke all on function padoka_private.padoka_housekeeping() from public, anon, authenticated;
grant execute on function padoka_private.padoka_housekeeping() to service_role;

do $$
declare v_jobid bigint;
begin
  for v_jobid in select jobid from cron.job where jobname='padoka-housekeeping-daily' loop
    perform cron.unschedule(v_jobid);
  end loop;
end
$$;

select cron.schedule(
  'padoka-housekeeping-daily',
  '17 4 * * *',
  $$select padoka_private.padoka_housekeeping();$$
);
