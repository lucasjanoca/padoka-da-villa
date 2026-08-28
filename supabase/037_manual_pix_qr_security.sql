-- PADOKA DA VILLA — Pix manual protegido para testes
-- O QR é estático; confirmação de pagamento exige conferência no banco pelo owner/manager.

update public.padoka_payment_settings
set enabled = true,
    provider = 'manual_pix',
    provider_configured = false,
    require_provider_confirmation = true,
    updated_at = now()
where id = true;

create or replace function public.padoka_pix_gate_enabled()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select s.enabled from public.padoka_payment_settings s where s.id=true),false);
$$;
revoke all on function public.padoka_pix_gate_enabled() from public,anon;
grant execute on function public.padoka_pix_gate_enabled() to authenticated;

create or replace function public.padoka_force_payment_gate_on_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_enabled boolean:=false;v_provider text:=null;v_provider_configured boolean:=false;
begin
  if new.payment_method='pix' then
    select coalesce(enabled,false),provider,coalesce(provider_configured,false)
      into v_enabled,v_provider,v_provider_configured
    from public.padoka_payment_settings where id=true;
    if v_enabled and coalesce(new.payment_status,'not_configured')='not_configured' then
      new.payment_status:='pending';
      new.payment_provider:=case when v_provider_configured then v_provider else 'manual_pix' end;
    end if;
  end if;
  return new;
end;$$;
revoke all on function public.padoka_force_payment_gate_on_order() from public,anon,authenticated;
drop trigger if exists padoka_force_payment_gate_on_order_trg on public.padoka_orders;
create trigger padoka_force_payment_gate_on_order_trg before insert on public.padoka_orders for each row execute function public.padoka_force_payment_gate_on_order();

create or replace function public.padoka_block_unpaid_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_required boolean:=false;
begin
  if new.status is distinct from old.status then
    select coalesce(enabled,false) into v_required from public.padoka_payment_settings where id=true;
    if v_required and new.status<>'cancelled' and old.payment_method='pix' and old.payment_status<>'paid' then
      raise exception 'payment confirmation required';
    end if;
  end if;
  return new;
end;$$;
revoke all on function public.padoka_block_unpaid_status_change() from public,anon,authenticated;
drop trigger if exists padoka_block_unpaid_status_change_trg on public.padoka_orders;
create trigger padoka_block_unpaid_status_change_trg before update of status on public.padoka_orders for each row execute function public.padoka_block_unpaid_status_change();

create or replace function public.padoka_confirm_manual_pix(p_order_id uuid,p_bank_reference text)
returns public.padoka_orders
language plpgsql
security definer
set search_path = public
as $$
declare v_order public.padoka_orders;v_reference text;v_settings public.padoka_payment_settings;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not public.padoka_staff_has_role(array['owner','manager']) then raise exception 'manager permission required'; end if;
  v_reference:=trim(coalesce(p_bank_reference,''));
  if char_length(v_reference)<8 or char_length(v_reference)>120 or v_reference~'[[:cntrl:]]' then raise exception 'valid bank reference required'; end if;
  select * into v_settings from public.padoka_payment_settings where id=true;
  if not found or not v_settings.enabled then raise exception 'payment gate is disabled'; end if;
  if v_settings.provider_configured or v_settings.provider<>'manual_pix' then raise exception 'manual pix confirmation is disabled'; end if;
  select * into v_order from public.padoka_orders where id=p_order_id for update;
  if not found then raise exception 'order not found'; end if;
  if v_order.payment_method<>'pix' then raise exception 'order is not pix'; end if;
  if v_order.payment_status='paid' then return v_order; end if;
  if v_order.payment_status not in ('pending','not_configured') then raise exception 'payment cannot be confirmed in current state'; end if;
  if exists(select 1 from public.padoka_orders o where o.id<>p_order_id and o.payment_status='paid' and o.payment_provider='manual_pix' and o.payment_reference=v_reference) then raise exception 'bank reference already used'; end if;
  update public.padoka_orders set payment_status='paid',paid_at=now(),payment_verified_at=now(),payment_provider='manual_pix',payment_reference=v_reference,updated_at=now() where id=p_order_id returning * into v_order;
  insert into public.padoka_payment_events(order_id,provider,provider_event_id,event_type,signature_valid,amount,result)
  values(v_order.id,'manual_pix',v_reference,'manual_bank_confirmation',false,v_order.total,'accepted')
  on conflict(provider,provider_event_id) do nothing;
  return v_order;
end;$$;
revoke all on function public.padoka_confirm_manual_pix(uuid,text) from public,anon;
grant execute on function public.padoka_confirm_manual_pix(uuid,text) to authenticated;

drop policy if exists padoka_customer_read_own_orders on public.padoka_orders;
create policy padoka_customer_read_own_orders on public.padoka_orders for select to authenticated using (
  customer_id=(select auth.uid()) or (public.padoka_is_staff() and (not public.padoka_pix_gate_enabled() or payment_status='paid' or public.padoka_staff_has_role(array['owner','manager'])))
);

drop policy if exists padoka_customer_read_own_order_items on public.padoka_order_items;
create policy padoka_customer_read_own_order_items on public.padoka_order_items for select to authenticated using (
  exists(select 1 from public.padoka_orders o where o.id=padoka_order_items.order_id and (o.customer_id=(select auth.uid()) or (public.padoka_is_staff() and (not public.padoka_pix_gate_enabled() or o.payment_status='paid' or public.padoka_staff_has_role(array['owner','manager'])))))
);

drop policy if exists padoka_customer_read_own_order_events on public.padoka_order_events;
create policy padoka_customer_read_own_order_events on public.padoka_order_events for select to authenticated using (
  exists(select 1 from public.padoka_orders o where o.id=padoka_order_events.order_id and (o.customer_id=(select auth.uid()) or (public.padoka_is_staff() and (not public.padoka_pix_gate_enabled() or o.payment_status='paid' or public.padoka_staff_has_role(array['owner','manager'])))))
);
