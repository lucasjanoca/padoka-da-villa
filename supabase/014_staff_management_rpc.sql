-- PADOKA DA VILLA — gestão segura de permissões internas
-- Backend alvo exclusivo: Sites De Clientes! (yncspxfsvlqdnodlsosb)
-- NÃO aplicar no projeto InfoTech.io.
-- Depende de padoka_staff_has_role(), criada pela migration 003.
-- Não cria trigger em auth.users e não concede acesso público.

create or replace function public.padoka_list_staff()
returns table (
  user_id uuid,
  role text,
  active boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.padoka_staff_has_role(array['owner']) then
    raise exception 'padoka owner permission required';
  end if;

  return query
  select s.user_id, s.role, s.active, s.created_at
  from public.padoka_staff_users s
  order by s.active desc, s.role, s.created_at;
end;
$$;

create or replace function public.padoka_update_staff(
  p_user_id uuid,
  p_role text,
  p_active boolean
) returns public.padoka_staff_users
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current public.padoka_staff_users;
  v_result public.padoka_staff_users;
  v_owner_count integer;
begin
  if not public.padoka_staff_has_role(array['owner']) then
    raise exception 'padoka owner permission required';
  end if;

  if p_user_id is null or p_role is null or p_active is null then
    raise exception 'staff data required';
  end if;

  if p_role not in ('owner','manager','cashier','attendant','production','stock') then
    raise exception 'invalid padoka staff role';
  end if;

  select * into v_current
  from public.padoka_staff_users
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'padoka staff user not found';
  end if;

  if p_user_id = auth.uid() and (p_role <> 'owner' or p_active is not true) then
    raise exception 'owner cannot remove own access';
  end if;

  if v_current.role = 'owner' and v_current.active
     and (p_role <> 'owner' or p_active is not true) then
    select count(*) into v_owner_count
    from public.padoka_staff_users
    where role = 'owner' and active = true;

    if v_owner_count <= 1 then
      raise exception 'cannot remove the last active owner';
    end if;
  end if;

  update public.padoka_staff_users
  set role = p_role,
      active = p_active
  where user_id = p_user_id
  returning * into v_result;

  return v_result;
end;
$$;

-- Funcionário comum só pode consultar o próprio cadastro interno.
-- Owners usam a RPC acima para listar toda a equipe.
drop policy if exists "padoka staff self read" on public.padoka_staff_users;
create policy "padoka staff self read"
on public.padoka_staff_users
for select to authenticated
using (
  user_id = auth.uid()
  or public.padoka_staff_has_role(array['owner'])
);

revoke all on public.padoka_staff_users from anon;
revoke insert, update, delete on public.padoka_staff_users from authenticated;
grant select on public.padoka_staff_users to authenticated;

revoke all on function public.padoka_list_staff() from public, anon;
grant execute on function public.padoka_list_staff() to authenticated;

revoke all on function public.padoka_update_staff(uuid,text,boolean) from public, anon;
grant execute on function public.padoka_update_staff(uuid,text,boolean) to authenticated;
