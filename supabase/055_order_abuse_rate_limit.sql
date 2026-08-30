
create or replace function padoka_private.padoka_order_abuse_guard()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_ten_minutes integer;
  v_one_hour integer;
begin
  if new.customer_id is null then
    raise exception 'customer required';
  end if;

  -- Retries with the same idempotency key are reconciled by the checkout RPC
  -- and must not count as a new abuse attempt.
  if new.request_id is not null and exists (
    select 1
    from public.padoka_orders o
    where o.customer_id = new.customer_id
      and o.request_id = new.request_id
  ) then
    return new;
  end if;

  select
    count(*) filter (where o.created_at >= now() - interval '10 minutes'),
    count(*) filter (where o.created_at >= now() - interval '1 hour')
  into v_ten_minutes, v_one_hour
  from public.padoka_orders o
  where o.customer_id = new.customer_id
    and o.created_at >= now() - interval '1 hour';

  if v_ten_minutes >= 10 or v_one_hour >= 30 then
    raise sqlstate 'PGRST' using
      message = json_build_object(
        'code','padoka_rate_limit',
        'message','Muitas tentativas de pedido. Aguarde alguns minutos e tente novamente.'
      )::text,
      detail = json_build_object(
        'status',429,
        'status_text','Too Many Requests'
      )::text;
  end if;

  return new;
end;
$$;

revoke all on function padoka_private.padoka_order_abuse_guard() from public,anon,authenticated;

drop trigger if exists padoka_order_abuse_guard_trg on public.padoka_orders;
create trigger padoka_order_abuse_guard_trg
before insert on public.padoka_orders
for each row execute function padoka_private.padoka_order_abuse_guard();
