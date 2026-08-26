-- PADOKA DA VILLA — espelha a otimização de avaliação RLS já aplicada no backend
-- Backend correto: Sites De Clientes! (yncspxfsvlqdnodlsosb).
-- Esta migration foi registrada no Supabase como optimize_padoka_rls_evaluation.
-- Não aplicar em InfoTech.io e não alterar objetos de outros sistemas.

alter policy "padoka_customer_create_own_profile"
on public.padoka_profiles
with check ((id = (select auth.uid())) and (app_scope = 'padoka'::text));

alter policy "padoka_customer_update_own_profile"
on public.padoka_profiles
using ((id = (select auth.uid())) and (app_scope = 'padoka'::text))
with check ((id = (select auth.uid())) and (app_scope = 'padoka'::text));

drop policy if exists "padoka_customer_read_own_profile" on public.padoka_profiles;
drop policy if exists "padoka_staff_read_customer_profiles" on public.padoka_profiles;
create policy "padoka_profiles_read_authorized"
on public.padoka_profiles for select to authenticated
using (
  ((id = (select auth.uid())) and (app_scope = 'padoka'::text))
  or exists (
    select 1 from public.padoka_staff_users s
    where s.user_id = (select auth.uid()) and s.active
  )
);

alter policy "padoka_staff_update_orders"
on public.padoka_orders
using (exists (
  select 1 from public.padoka_staff_users s
  where s.user_id = (select auth.uid()) and s.active
))
with check (exists (
  select 1 from public.padoka_staff_users s
  where s.user_id = (select auth.uid()) and s.active
));

alter policy "padoka_customer_read_own_orders"
on public.padoka_orders
using (
  (customer_id = (select auth.uid()))
  or (public.padoka_is_staff() and ((not public.padoka_pix_gate_enabled()) or payment_status = 'paid'::text))
);

alter policy "padoka_customer_read_own_order_items"
on public.padoka_order_items
using (exists (
  select 1 from public.padoka_orders o
  where o.id = padoka_order_items.order_id
    and (
      o.customer_id = (select auth.uid())
      or exists (
        select 1 from public.padoka_staff_users s
        where s.user_id = (select auth.uid()) and s.active
      )
    )
));

alter policy "padoka_customer_read_own_order_events"
on public.padoka_order_events
using (exists (
  select 1 from public.padoka_orders o
  where o.id = padoka_order_events.order_id
    and (
      o.customer_id = (select auth.uid())
      or exists (
        select 1 from public.padoka_staff_users s
        where s.user_id = (select auth.uid()) and s.active
      )
    )
));

drop policy if exists "padoka staff self read" on public.padoka_staff_users;
drop policy if exists "padoka_staff_read_self" on public.padoka_staff_users;
create policy "padoka_staff_read_authorized"
on public.padoka_staff_users for select to authenticated
using (
  user_id = (select auth.uid())
  or public.padoka_staff_has_role(array['owner'])
);
