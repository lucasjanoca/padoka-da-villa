-- PADOKA DA VILLA — Pix: 5 minutos e fila operacional somente após pagamento confirmado

update public.padoka_payment_settings
set expiration_seconds = 300,
    updated_at = now()
where id = true;

-- A equipe só enxerga pedidos pagos quando o Pix automático estiver realmente ativado.
-- O cliente continua enxergando o próprio pedido pendente/expirado para acompanhamento.
drop policy if exists padoka_customer_read_own_orders on public.padoka_orders;
create policy padoka_customer_read_own_orders
on public.padoka_orders
for select
to authenticated
using (
  customer_id = auth.uid()
  or (
    exists (
      select 1
      from public.padoka_staff_users s
      where s.user_id = auth.uid()
        and s.active
    )
    and (
      not exists (
        select 1
        from public.padoka_payment_settings ps
        where ps.id = true
          and ps.enabled
          and ps.provider_configured
      )
      or payment_status = 'paid'
    )
  )
);

-- Mesmo que alguém da equipe tente chamar a RPC diretamente, pedido não pago
-- não avança na operação. Cancelamento continua permitido.
create or replace function public.padoka_update_order_status(
  p_order_id uuid,
  p_status text
) returns public.padoka_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.padoka_orders;
  v_allowed boolean := false;
  v_payment_required boolean := false;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not public.padoka_is_staff() then raise exception 'staff permission required'; end if;
  if p_order_id is null then raise exception 'order id required'; end if;
  if p_status not in ('received','seen','confirmed','preparing','ready','completed','cancelled') then raise exception 'invalid order status'; end if;

  select * into v_order from public.padoka_orders where id=p_order_id for update;
  if not found then raise exception 'order not found'; end if;
  if v_order.status in ('completed','cancelled') then raise exception 'order already finalized'; end if;

  select coalesce(enabled and provider_configured,false)
    into v_payment_required
  from public.padoka_payment_settings
  where id=true;

  if v_payment_required and p_status <> 'cancelled' and v_order.payment_status <> 'paid' then
    raise exception 'payment confirmation required';
  end if;

  v_allowed := case v_order.status
    when 'received' then p_status in ('seen','cancelled')
    when 'seen' then p_status in ('confirmed','cancelled')
    when 'confirmed' then p_status in ('preparing','cancelled')
    when 'preparing' then p_status in ('ready','cancelled')
    when 'ready' then p_status in ('completed','cancelled')
    else false
  end;

  if not v_allowed then raise exception 'invalid status transition'; end if;

  update public.padoka_orders
  set status=p_status,
      seen_at=case when p_status='seen' and seen_at is null then now() else seen_at end,
      confirmed_at=case when p_status='confirmed' and confirmed_at is null then now() else confirmed_at end,
      preparing_at=case when p_status='preparing' and preparing_at is null then now() else preparing_at end,
      ready_at=case when p_status='ready' and ready_at is null then now() else ready_at end,
      completed_at=case when p_status='completed' and completed_at is null then now() else completed_at end,
      cancelled_at=case when p_status='cancelled' and cancelled_at is null then now() else cancelled_at end,
      updated_at=now()
  where id=p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

revoke all on function public.padoka_update_order_status(uuid,text) from public,anon;
grant execute on function public.padoka_update_order_status(uuid,text) to authenticated;
