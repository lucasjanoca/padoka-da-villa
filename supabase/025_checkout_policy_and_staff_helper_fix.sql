-- PADOKA DA VILLA — corrige checkout e leitura operacional após fundação Pix

-- Helper de equipe é usado por várias políticas/RPCs. Ele só retorna booleano
-- baseado no usuário autenticado, sem expor dados de funcionários.
revoke all on function public.padoka_is_staff() from public, anon;
grant execute on function public.padoka_is_staff() to authenticated;

-- A política de pedidos não deve consultar diretamente a tabela privada de
-- configurações de pagamento, pois authenticated não tem SELECT nela.
create or replace function public.padoka_pix_gate_enabled()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select s.enabled and s.provider_configured
    from public.padoka_payment_settings s
    where s.id = true
  ), false);
$$;

revoke all on function public.padoka_pix_gate_enabled() from public, anon;
grant execute on function public.padoka_pix_gate_enabled() to authenticated;

drop policy if exists padoka_customer_read_own_orders on public.padoka_orders;
create policy padoka_customer_read_own_orders
on public.padoka_orders
for select
to authenticated
using (
  customer_id = auth.uid()
  or (
    public.padoka_is_staff()
    and (
      not public.padoka_pix_gate_enabled()
      or payment_status = 'paid'
    )
  )
);
