-- PADOKA DA VILLA — reduz leitura de perfis de clientes por funcionários
-- Backend alvo exclusivo: Sites De Clientes! (yncspxfsvlqdnodlsosb)
-- NÃO aplicar no projeto InfoTech.io.

alter table public.padoka_profiles enable row level security;

drop policy if exists "padoka_profiles_read_authorized" on public.padoka_profiles;

create policy "padoka_profiles_read_authorized"
on public.padoka_profiles
for select
to authenticated
using (
  (
    id = (select auth.uid())
    and app_scope = 'padoka'
  )
  or public.padoka_staff_has_role(array['owner','manager'])
  or (
    public.padoka_is_staff()
    and exists (
      select 1
      from public.padoka_orders o
      where o.customer_id = padoka_profiles.id
        and (
          not public.padoka_pix_gate_enabled()
          or o.payment_status = 'paid'
        )
    )
  )
);

-- Esta migration apenas reduz o conjunto de linhas visíveis a staff não-gerencial.
-- Não amplia grants nem cria caminhos de escrita direta.
