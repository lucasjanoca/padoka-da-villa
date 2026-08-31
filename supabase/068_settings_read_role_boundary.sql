-- PADOKA DA VILLA — restringe leitura de configurações aos papéis responsáveis
-- Backend alvo exclusivo: Sites De Clientes! (yncspxfsvlqdnodlsosb)
-- NÃO aplicar no projeto InfoTech.io.
-- Mantém objetos PADOKA isolados e não cria trigger em auth.users.

alter table public.padoka_settings enable row level security;

drop policy if exists "padoka staff read settings" on public.padoka_settings;
drop policy if exists "padoka management read settings" on public.padoka_settings;

create policy "padoka management read settings"
on public.padoka_settings
for select
to authenticated
using ((select public.padoka_staff_has_role(array['owner','manager'])));

-- A RPC pública continua SECURITY INVOKER. A implementação privilegiada
-- permanece no schema privado e agora aplica a mesma fronteira de papel da UI.
create or replace function padoka_private.padoka_get_settings()
returns public.padoka_settings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.padoka_settings;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if not padoka_private.staff_has_role(array['owner','manager']) then
    raise exception 'padoka settings permission required';
  end if;

  select * into v_row
  from public.padoka_settings
  where id = 'main';

  return v_row;
end;
$$;

-- Não amplia ACLs: os grants existentes continuam inalterados.
