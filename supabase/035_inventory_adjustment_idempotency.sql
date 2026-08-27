-- PADOKA DA VILLA — ajuste manual de estoque idempotente
-- Mantém o ajuste server-authoritative e evita aplicar o mesmo delta duas vezes
-- quando a resposta da rede fica incerta.

create unique index if not exists padoka_inventory_adjustment_request_uidx
on public.padoka_inventory_movements(reference_id)
where source = 'adjustment' and reference_id is not null;

create or replace function public.padoka_adjust_inventory_once(
  p_product_id text,
  p_delta numeric,
  p_reason text,
  p_request_id uuid
)
returns public.padoka_inventory
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.padoka_inventory;
  v_existing public.padoka_inventory_movements;
  v_reason text;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if not public.padoka_staff_has_role(array['owner','manager','stock']) then
    raise exception 'padoka inventory permission required';
  end if;

  if p_request_id is null then
    raise exception 'inventory request id required';
  end if;

  if p_delta is null or p_delta = 0 or abs(p_delta) > 1000000 then
    raise exception 'invalid inventory delta';
  end if;

  v_reason := trim(coalesce(p_reason, ''));
  if char_length(v_reason) not between 2 and 120 then
    raise exception 'invalid inventory reason';
  end if;

  if not exists (
    select 1
    from public.padoka_products p
    where p.id = p_product_id
      and p.active = true
  ) then
    raise exception 'unknown or inactive product';
  end if;

  select *
    into v_existing
  from public.padoka_inventory_movements m
  where m.source = 'adjustment'
    and m.reference_id = p_request_id;

  if v_existing.id is not null then
    if v_existing.product_id is distinct from p_product_id
      or v_existing.delta is distinct from p_delta
      or v_existing.reason is distinct from v_reason
      or v_existing.created_by is distinct from auth.uid()
    then
      raise exception 'inventory request id conflict';
    end if;

    select * into v_row
    from public.padoka_inventory
    where product_id = p_product_id;

    if v_row.product_id is null then
      raise exception 'inventory adjustment reconciliation failed';
    end if;

    return v_row;
  end if;

  insert into public.padoka_inventory(product_id, quantity, updated_by)
  values (p_product_id, 0, auth.uid())
  on conflict (product_id) do nothing;

  update public.padoka_inventory
  set quantity = quantity + p_delta,
      updated_by = auth.uid(),
      updated_at = now()
  where product_id = p_product_id
    and quantity + p_delta >= 0
  returning * into v_row;

  if v_row.product_id is null then
    raise exception 'insufficient inventory';
  end if;

  insert into public.padoka_inventory_movements(
    product_id,
    delta,
    reason,
    source,
    reference_id,
    created_by
  )
  values (
    p_product_id,
    p_delta,
    v_reason,
    'adjustment',
    p_request_id,
    auth.uid()
  );

  return v_row;
end;
$$;

revoke all on function public.padoka_adjust_inventory_once(text, numeric, text, uuid) from public;
revoke all on function public.padoka_adjust_inventory_once(text, numeric, text, uuid) from anon;
revoke all on function public.padoka_adjust_inventory_once(text, numeric, text, uuid) from authenticated;
grant execute on function public.padoka_adjust_inventory_once(text, numeric, text, uuid) to authenticated;
grant execute on function public.padoka_adjust_inventory_once(text, numeric, text, uuid) to service_role;
