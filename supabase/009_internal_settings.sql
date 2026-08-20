-- PADOKA DA VILLA — configurações operacionais internas
-- Backend alvo exclusivo: Sites De Clientes! (yncspxfsvlqdnodlsosb)
-- NÃO aplicar no projeto InfoTech.io.
-- Depende de padoka_staff_has_role(), criada pela migration 003.
-- Não cria trigger em auth.users; todos os objetos permanecem isolados por prefixo padoka_.

create table if not exists public.padoka_settings (
  id text primary key default 'main' check (id = 'main'),
  open_time time without time zone,
  close_time time without time zone,
  night_time time without time zone,
  payment_method text check (payment_method is null or payment_method in ('pix','cash','card')),
  note text check (note is null or char_length(note) <= 1000),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.padoka_settings(id)
values ('main')
on conflict (id) do nothing;

create or replace function public.padoka_get_settings()
returns public.padoka_settings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.padoka_settings;
begin
  if not public.padoka_is_staff() then
    raise exception 'padoka staff permission required';
  end if;

  select * into v_row
  from public.padoka_settings
  where id = 'main';

  return v_row;
end;
$$;

create or replace function public.padoka_update_settings(
  p_open_time time without time zone,
  p_close_time time without time zone,
  p_night_time time without time zone default null,
  p_payment_method text default null,
  p_note text default null
) returns public.padoka_settings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.padoka_settings;
  v_note text;
begin
  if not public.padoka_staff_has_role(array['owner','manager']) then
    raise exception 'padoka settings permission required';
  end if;

  if p_open_time is null or p_close_time is null or p_open_time >= p_close_time then
    raise exception 'invalid opening hours';
  end if;

  if p_payment_method is not null and p_payment_method not in ('pix','cash','card') then
    raise exception 'invalid payment method';
  end if;

  v_note := nullif(trim(coalesce(p_note,'')),'');
  if v_note is not null and char_length(v_note) > 1000 then
    raise exception 'settings note too long';
  end if;

  insert into public.padoka_settings(id,open_time,close_time,night_time,payment_method,note,updated_by,updated_at)
  values('main',p_open_time,p_close_time,p_night_time,p_payment_method,v_note,auth.uid(),now())
  on conflict (id) do update
  set open_time = excluded.open_time,
      close_time = excluded.close_time,
      night_time = excluded.night_time,
      payment_method = excluded.payment_method,
      note = excluded.note,
      updated_by = auth.uid(),
      updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

alter table public.padoka_settings enable row level security;

drop policy if exists "padoka staff read settings" on public.padoka_settings;
create policy "padoka staff read settings" on public.padoka_settings
for select to authenticated
using (public.padoka_is_staff());

revoke all on public.padoka_settings from anon;
revoke all on public.padoka_settings from authenticated;
grant select on public.padoka_settings to authenticated;

revoke all on function public.padoka_get_settings() from public, anon;
grant execute on function public.padoka_get_settings() to authenticated;

revoke all on function public.padoka_update_settings(time without time zone,time without time zone,time without time zone,text,text) from public, anon;
grant execute on function public.padoka_update_settings(time without time zone,time without time zone,time without time zone,text,text) to authenticated;
