-- PADOKA DA VILLA — otimizações de performance RLS e chaves estrangeiras

create index if not exists padoka_customer_notifications_order_idx
  on public.padoka_customer_notifications(order_id)
  where order_id is not null;

create index if not exists padoka_purchase_order_items_product_idx
  on public.padoka_purchase_order_items(product_id);

drop policy if exists padoka_feature_flags_public_read on public.padoka_feature_flags;
drop policy if exists padoka_feature_flags_staff_read on public.padoka_feature_flags;

create policy padoka_feature_flags_anon_read
on public.padoka_feature_flags
for select to anon
using (audience='public');

create policy padoka_feature_flags_authenticated_read
on public.padoka_feature_flags
for select to authenticated
using (
  audience='public'
  or (select padoka_private.is_staff())
);

drop policy if exists padoka_feature_flags_admin_update on public.padoka_feature_flags;
create policy padoka_feature_flags_admin_update
on public.padoka_feature_flags
for update to authenticated
using (
  (select padoka_private.staff_has_role(array['owner','manager']))
  and coalesce((select auth.jwt())->>'aal','aal1')='aal2'
)
with check (
  (select padoka_private.staff_has_role(array['owner','manager']))
  and coalesce((select auth.jwt())->>'aal','aal1')='aal2'
);

drop policy if exists padoka_incidents_admin_update on public.padoka_incidents;
create policy padoka_incidents_admin_update
on public.padoka_incidents
for update to authenticated
using (
  (select padoka_private.staff_has_role(array['owner','manager']))
  and coalesce((select auth.jwt())->>'aal','aal1')='aal2'
)
with check (
  (select padoka_private.staff_has_role(array['owner','manager']))
  and coalesce((select auth.jwt())->>'aal','aal1')='aal2'
);

drop policy if exists padoka_loyalty_account_own_read on public.padoka_loyalty_accounts;
create policy padoka_loyalty_account_own_read
on public.padoka_loyalty_accounts
for select to authenticated
using (
  user_id=(select auth.uid())
  or (select padoka_private.staff_has_role(array['owner','manager']))
);

drop policy if exists padoka_loyalty_ledger_own_read on public.padoka_loyalty_ledger;
create policy padoka_loyalty_ledger_own_read
on public.padoka_loyalty_ledger
for select to authenticated
using (
  user_id=(select auth.uid())
  or (select padoka_private.staff_has_role(array['owner','manager']))
);

drop policy if exists padoka_customer_notifications_own_read on public.padoka_customer_notifications;
create policy padoka_customer_notifications_own_read
on public.padoka_customer_notifications
for select to authenticated
using (user_id=(select auth.uid()));

drop policy if exists padoka_customer_notifications_own_update on public.padoka_customer_notifications;
create policy padoka_customer_notifications_own_update
on public.padoka_customer_notifications
for update to authenticated
using (user_id=(select auth.uid()))
with check (user_id=(select auth.uid()));

drop policy if exists padoka_privacy_own_read on public.padoka_privacy_requests;
create policy padoka_privacy_own_read
on public.padoka_privacy_requests
for select to authenticated
using (
  user_id=(select auth.uid())
  or (select padoka_private.staff_has_role(array['owner']))
);

drop policy if exists padoka_privacy_own_insert on public.padoka_privacy_requests;
create policy padoka_privacy_own_insert
on public.padoka_privacy_requests
for insert to authenticated
with check (
  user_id=(select auth.uid())
  and status='pending'
);

drop policy if exists padoka_privacy_owner_update on public.padoka_privacy_requests;
create policy padoka_privacy_owner_update
on public.padoka_privacy_requests
for update to authenticated
using (
  (select padoka_private.staff_has_role(array['owner']))
  and coalesce((select auth.jwt())->>'aal','aal1')='aal2'
)
with check (
  (select padoka_private.staff_has_role(array['owner']))
  and coalesce((select auth.jwt())->>'aal','aal1')='aal2'
);
