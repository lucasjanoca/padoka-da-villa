-- PADOKA DA VILLA — inclusão segura de funcionário já autenticado
-- Backend alvo exclusivo: Sites De Clientes! (yncspxfsvlqdnodlsosb)
-- NÃO aplicar no projeto InfoTech.io.
-- Depende das migrations 003 e 014.
-- Não cria usuário Auth, não cria padoka_profiles e não cria trigger em auth.users.

create or replace function public.padoka_add_staff_by_email(
  p_email text,
  p_role text
) returns public.padoka_staff_users
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_user_id uuid;
  v_result public.padoka_staff_users;
begin
  if not public.padoka_staff_has_role(array['owner']) then
    raise exception 'padoka owner permission required';
  end if;

  v_email := lower(trim(coalesce(p_email, '')));

  if v_email = '' or length(v_email) > 254
     or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'invalid staff email';
  end if;

  if p_role not in ('owner','manager','cashier','attendant','production','stock') then
    raise exception 'invalid padoka staff role';
  end if;

  select u.id into v_user_id
  from auth.users u
  where lower(u.email) = v_email
  order by u.created_at asc
  limit 1;

  if v_user_id is null then
    raise exception 'auth user not found';
  end if;

  if exists (
    select 1
    from public.padoka_staff_users s
    where s.user_id = v_user_id
  ) then
    raise exception 'padoka staff already exists';
  end if;

  insert into public.padoka_staff_users(user_id, role, active)
  values(v_user_id, p_role, true)
  returning * into v_result;

  return v_result;
end;
$$;

revoke all on function public.padoka_add_staff_by_email(text,text) from public, anon;
grant execute on function public.padoka_add_staff_by_email(text,text) to authenticated;
