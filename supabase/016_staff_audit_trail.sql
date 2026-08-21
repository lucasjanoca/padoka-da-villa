-- PADOKA DA VILLA — auditoria de alterações da equipe interna
-- Backend alvo exclusivo: Sites De Clientes! (yncspxfsvlqdnodlsosb)
-- NÃO aplicar no projeto InfoTech.io.
-- Depende das migrations 003, 014 e 015.
-- Não cria usuário Auth, não cria padoka_profiles e não cria trigger em auth.users.

create table if not exists public.padoka_staff_audit (
  id bigint generated always as identity primary key,
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  target_user_id uuid not null references auth.users(id) on delete restrict,
  action text not null check (action in ('added','updated')),
  old_role text check (old_role is null or old_role in ('owner','manager','cashier','attendant','production','stock')),
  new_role text not null check (new_role in ('owner','manager','cashier','attendant','production','stock')),
  old_active boolean,
  new_active boolean not null,
  created_at timestamptz not null default now()
);

alter table public.padoka_staff_audit enable row level security;

create index if not exists padoka_staff_audit_created_idx
  on public.padoka_staff_audit(created_at desc);
create index if not exists padoka_staff_audit_target_idx
  on public.padoka_staff_audit(target_user_id, created_at desc);

drop policy if exists "padoka owners read staff audit" on public.padoka_staff_audit;
create policy "padoka owners read staff audit"
on public.padoka_staff_audit
for select to authenticated
using (public.padoka_staff_has_role(array['owner']));

revoke all on public.padoka_staff_audit from anon;
revoke insert, update, delete on public.padoka_staff_audit from authenticated;
grant select on public.padoka_staff_audit to authenticated;

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

  -- Serializa alterações administrativas para preservar a regra do último owner.
  perform pg_advisory_xact_lock(hashtext('padoka_staff_owner_guard'));

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

  if v_current.role = p_role and v_current.active = p_active then
    return v_current;
  end if;

  update public.padoka_staff_users
  set role = p_role,
      active = p_active
  where user_id = p_user_id
  returning * into v_result;

  insert into public.padoka_staff_audit(
    actor_user_id,target_user_id,action,
    old_role,new_role,old_active,new_active
  ) values (
    auth.uid(),p_user_id,'updated',
    v_current.role,v_result.role,v_current.active,v_result.active
  );

  return v_result;
end;
$$;

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

  perform pg_advisory_xact_lock(hashtext('padoka_staff_owner_guard'));

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

  insert into public.padoka_staff_audit(
    actor_user_id,target_user_id,action,
    old_role,new_role,old_active,new_active
  ) values (
    auth.uid(),v_user_id,'added',
    null,v_result.role,null,v_result.active
  );

  return v_result;
end;
$$;

create or replace function public.padoka_list_staff_audit(
  p_limit integer default 30
) returns table (
  id bigint,
  action text,
  actor_user_id uuid,
  actor_name text,
  actor_email text,
  target_user_id uuid,
  target_name text,
  target_email text,
  old_role text,
  new_role text,
  old_active boolean,
  new_active boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer;
begin
  if not public.padoka_staff_has_role(array['owner']) then
    raise exception 'padoka owner permission required';
  end if;

  v_limit := greatest(1, least(coalesce(p_limit, 30), 100));

  return query
  select
    a.id,
    a.action,
    a.actor_user_id,
    left(coalesce(nullif(trim(au.raw_user_meta_data ->> 'full_name'),''), nullif(trim(au.raw_user_meta_data ->> 'name'),''), split_part(coalesce(au.email,''),'@',1), 'Funcionário'),80),
    left(coalesce(au.email,''),254),
    a.target_user_id,
    left(coalesce(nullif(trim(tu.raw_user_meta_data ->> 'full_name'),''), nullif(trim(tu.raw_user_meta_data ->> 'name'),''), split_part(coalesce(tu.email,''),'@',1), 'Funcionário'),80),
    left(coalesce(tu.email,''),254),
    a.old_role,
    a.new_role,
    a.old_active,
    a.new_active,
    a.created_at
  from public.padoka_staff_audit a
  join auth.users au on au.id = a.actor_user_id
  join auth.users tu on tu.id = a.target_user_id
  order by a.created_at desc, a.id desc
  limit v_limit;
end;
$$;

revoke all on function public.padoka_update_staff(uuid,text,boolean) from public, anon;
grant execute on function public.padoka_update_staff(uuid,text,boolean) to authenticated;

revoke all on function public.padoka_add_staff_by_email(text,text) from public, anon;
grant execute on function public.padoka_add_staff_by_email(text,text) to authenticated;

revoke all on function public.padoka_list_staff_audit(integer) from public, anon;
grant execute on function public.padoka_list_staff_audit(integer) to authenticated;
