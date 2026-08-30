-- PADOKA DA VILLA — helpers privilegiados fora do schema exposto
-- Mantém as assinaturas públicas usadas por RLS/frontend, mas move a lógica SECURITY DEFINER
-- para um schema dedicado que não faz parte da superfície normal do Data API.

create schema if not exists padoka_private;
revoke all on schema padoka_private from public, anon;
grant usage on schema padoka_private to authenticated, service_role;

create or replace function padoka_private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists(
    select 1
    from public.padoka_staff_users s
    where s.user_id = auth.uid()
      and s.active = true
  );
$$;

revoke all on function padoka_private.is_staff() from public, anon;
grant execute on function padoka_private.is_staff() to authenticated, service_role;

create or replace function public.padoka_is_staff()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select padoka_private.is_staff();
$$;

revoke all on function public.padoka_is_staff() from public, anon;
grant execute on function public.padoka_is_staff() to authenticated, service_role;

create or replace function padoka_private.staff_has_role(p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists(
    select 1
    from public.padoka_staff_users s
    where s.user_id = auth.uid()
      and s.active = true
      and s.role = any(p_roles)
  );
$$;

revoke all on function padoka_private.staff_has_role(text[]) from public, anon;
grant execute on function padoka_private.staff_has_role(text[]) to authenticated, service_role;

create or replace function public.padoka_staff_has_role(p_roles text[])
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select padoka_private.staff_has_role(p_roles);
$$;

revoke all on function public.padoka_staff_has_role(text[]) from public, anon;
grant execute on function public.padoka_staff_has_role(text[]) to authenticated, service_role;

create or replace function padoka_private.pix_gate_enabled()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select s.enabled
    from public.padoka_payment_settings s
    where s.id = true
  ), false);
$$;

revoke all on function padoka_private.pix_gate_enabled() from public, anon;
grant execute on function padoka_private.pix_gate_enabled() to authenticated, service_role;

create or replace function public.padoka_pix_gate_enabled()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select padoka_private.pix_gate_enabled();
$$;

revoke all on function public.padoka_pix_gate_enabled() from public, anon;
grant execute on function public.padoka_pix_gate_enabled() to authenticated, service_role;

create or replace function padoka_private.payment_public_config()
returns table(
  enabled boolean,
  provider_configured boolean,
  provider text,
  expiration_seconds integer,
  late_payment_policy text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.enabled,
    s.provider_configured,
    case when s.provider_configured then s.provider else 'unconfigured' end,
    s.expiration_seconds,
    s.late_payment_policy
  from public.padoka_payment_settings s
  where s.id = true;
$$;

revoke all on function padoka_private.payment_public_config() from public, anon;
grant execute on function padoka_private.payment_public_config() to authenticated, service_role;

create or replace function public.padoka_payment_public_config()
returns table(
  enabled boolean,
  provider_configured boolean,
  provider text,
  expiration_seconds integer,
  late_payment_policy text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from padoka_private.payment_public_config();
$$;

revoke all on function public.padoka_payment_public_config() from public, anon;
grant execute on function public.padoka_payment_public_config() to authenticated, service_role;
