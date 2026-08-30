-- PADOKA DA VILLA — MFA obrigatório para mutações administrativas sensíveis
-- Owner/manager precisam estar em AAL2 (TOTP/segundo fator) quando auth.uid() está presente.
-- Operações internas de service_role continuam permitidas porque não carregam a identidade de staff.

create or replace function public.padoka_require_privileged_aal2()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_aal text := coalesce(auth.jwt()->>'aal','aal1');
begin
  if v_uid is null then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  select s.role
    into v_role
  from public.padoka_staff_users s
  where s.user_id = v_uid
    and s.active = true;

  if v_role in ('owner','manager') and v_aal <> 'aal2' then
    raise exception 'PADOKA privileged operation requires MFA (aal2)'
      using errcode = '42501';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function public.padoka_require_privileged_aal2() from public, anon, authenticated;

drop trigger if exists padoka_mfa_staff_users_trg on public.padoka_staff_users;
create trigger padoka_mfa_staff_users_trg
before insert or update or delete on public.padoka_staff_users
for each row execute function public.padoka_require_privileged_aal2();

drop trigger if exists padoka_mfa_products_trg on public.padoka_products;
create trigger padoka_mfa_products_trg
before insert or update or delete on public.padoka_products
for each row execute function public.padoka_require_privileged_aal2();

drop trigger if exists padoka_mfa_settings_trg on public.padoka_settings;
create trigger padoka_mfa_settings_trg
before insert or update or delete on public.padoka_settings
for each row execute function public.padoka_require_privileged_aal2();

drop trigger if exists padoka_mfa_sales_void_trg on public.padoka_sales;
create trigger padoka_mfa_sales_void_trg
before update on public.padoka_sales
for each row execute function public.padoka_require_privileged_aal2();

drop trigger if exists padoka_mfa_manual_pix_trg on public.padoka_orders;
create trigger padoka_mfa_manual_pix_trg
before update of payment_status, payment_provider, payment_reference on public.padoka_orders
for each row execute function public.padoka_require_privileged_aal2();

-- Trigger functions are implementation details and must not be callable as public RPCs.
revoke all on function public.padoka_apply_status_timestamps() from public, anon, authenticated;
revoke all on function public.padoka_block_unpaid_status_change() from public, anon, authenticated;
revoke all on function public.padoka_force_payment_gate_on_order() from public, anon, authenticated;
revoke all on function public.padoka_log_order_status() from public, anon, authenticated;
revoke all on function public.padoka_stamp_production_plan() from public, anon, authenticated;
revoke all on function public.padoka_touch_operational_updated_at() from public, anon, authenticated;
revoke all on function public.padoka_touch_updated_at() from public, anon, authenticated;
