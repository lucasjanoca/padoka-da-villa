-- PADOKA DA VILLA — transições de status de pedido controladas no servidor
-- Aplicar somente no projeto Sites De Clientes! (yncspxfsvlqdnodlsosb).
-- Não aplicar no projeto InfoTech.io.

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
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if not public.padoka_is_staff() then
    raise exception 'staff permission required';
  end if;

  if p_order_id is null then
    raise exception 'order id required';
  end if;

  if p_status not in ('received','seen','confirmed','preparing','ready','completed','cancelled') then
    raise exception 'invalid order status';
  end if;

  select *
    into v_order
  from public.padoka_orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'order not found';
  end if;

  if v_order.status in ('completed','cancelled') then
    raise exception 'order already finalized';
  end if;

  v_allowed := case v_order.status
    when 'received' then p_status in ('seen','cancelled')
    when 'seen' then p_status in ('confirmed','cancelled')
    when 'confirmed' then p_status in ('preparing','cancelled')
    when 'preparing' then p_status in ('ready','cancelled')
    when 'ready' then p_status in ('completed','cancelled')
    else false
  end;

  if not v_allowed then
    raise exception 'invalid status transition';
  end if;

  update public.padoka_orders
  set status = p_status,
      seen_at = case when p_status = 'seen' and seen_at is null then now() else seen_at end,
      confirmed_at = case when p_status = 'confirmed' and confirmed_at is null then now() else confirmed_at end,
      ready_at = case when p_status = 'ready' and ready_at is null then now() else ready_at end,
      completed_at = case when p_status = 'completed' and completed_at is null then now() else completed_at end,
      cancelled_at = case when p_status = 'cancelled' and cancelled_at is null then now() else cancelled_at end
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

-- Depois desta migration, mudanças de status devem passar exclusivamente pela RPC.
revoke update on table public.padoka_orders from authenticated;
revoke all on function public.padoka_update_order_status(uuid,text) from public, anon;
grant execute on function public.padoka_update_order_status(uuid,text) to authenticated;
