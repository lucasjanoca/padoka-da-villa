-- PADOKA DA VILLA — perfil de cliente controlado pelo servidor
-- Aplicar somente no projeto Sites De Clientes! (yncspxfsvlqdnodlsosb).
-- Não cria trigger em auth.users e não afeta usuários de outros sistemas.

alter table public.padoka_profiles
  add column if not exists app_scope text,
  add column if not exists avatar_url text,
  add column if not exists auth_provider text,
  add column if not exists privacy_accepted_at timestamptz;

update public.padoka_profiles
set app_scope = 'padoka'
where app_scope is null;

alter table public.padoka_profiles
  alter column app_scope set default 'padoka',
  alter column app_scope set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'padoka_profiles_app_scope_check'
      and conrelid = 'public.padoka_profiles'::regclass
  ) then
    alter table public.padoka_profiles
      add constraint padoka_profiles_app_scope_check
      check (app_scope = 'padoka');
  end if;
end
$$;

create or replace function public.padoka_save_profile(
  p_full_name text,
  p_phone text,
  p_birthday date default null,
  p_marketing_opt_in boolean default false,
  p_privacy_accepted boolean default false
) returns public.padoka_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.padoka_profiles;
  v_name text := trim(coalesce(p_full_name, ''));
  v_phone text := trim(coalesce(p_phone, ''));
  v_avatar text;
  v_provider text;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if length(v_name) < 2 or length(v_name) > 80 then
    raise exception 'invalid full name';
  end if;

  if length(v_phone) < 8 or length(v_phone) > 30 then
    raise exception 'invalid phone';
  end if;

  if coalesce(p_privacy_accepted, false) is not true then
    raise exception 'privacy consent required';
  end if;

  if p_birthday is not null
     and (p_birthday > current_date or p_birthday < (current_date - interval '120 years')::date) then
    raise exception 'invalid birthday';
  end if;

  v_avatar := coalesce(
    nullif(auth.jwt()->'user_metadata'->>'avatar_url', ''),
    nullif(auth.jwt()->'user_metadata'->>'picture', '')
  );

  -- Metadados de identidade vêm da sessão autenticada, mas ainda são tratados como dados externos.
  -- O banco só persiste avatar HTTPS com tamanho razoável; qualquer outro valor é descartado.
  if v_avatar is not null and (length(v_avatar) > 500 or v_avatar !~* '^https://') then
    v_avatar := null;
  end if;

  v_provider := lower(coalesce(nullif(auth.jwt()->'app_metadata'->>'provider', ''), 'email'));
  if v_provider not in ('google', 'email') then
    v_provider := 'other';
  end if;

  insert into public.padoka_profiles as existing_profile(
    id,
    app_scope,
    full_name,
    phone,
    birthday,
    avatar_url,
    auth_provider,
    marketing_opt_in,
    privacy_accepted_at,
    onboarding_completed,
    updated_at
  ) values (
    auth.uid(),
    'padoka',
    v_name,
    v_phone,
    p_birthday,
    v_avatar,
    v_provider,
    coalesce(p_marketing_opt_in, false),
    now(),
    true,
    now()
  )
  on conflict (id) do update set
    app_scope = 'padoka',
    full_name = excluded.full_name,
    phone = excluded.phone,
    birthday = excluded.birthday,
    avatar_url = coalesce(excluded.avatar_url, existing_profile.avatar_url),
    auth_provider = excluded.auth_provider,
    marketing_opt_in = excluded.marketing_opt_in,
    privacy_accepted_at = coalesce(existing_profile.privacy_accepted_at, now()),
    onboarding_completed = true,
    updated_at = now()
  returning * into v_profile;

  return v_profile;
end;
$$;

revoke all on function public.padoka_save_profile(text,text,date,boolean,boolean) from public, anon;
grant execute on function public.padoka_save_profile(text,text,date,boolean,boolean) to authenticated;

-- Depois desta migration, clientes autenticados salvam o próprio perfil somente pela RPC.
-- Leitura continua protegida pela RLS existente e staff mantém apenas as permissões já definidas.
revoke insert, update on table public.padoka_profiles from authenticated;
grant select on table public.padoka_profiles to authenticated;
