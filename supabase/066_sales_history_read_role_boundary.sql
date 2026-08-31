-- PADOKA: direct sales history is readable only by management roles.
-- Cashier/attendant sale creation remains server-authoritative through RPCs and
-- no longer depends on SELECT against padoka_sales for capability detection.

alter table public.padoka_sales enable row level security;
alter table public.padoka_sale_items enable row level security;

revoke all on public.padoka_sales from anon;
revoke insert, update, delete, truncate, references, trigger
  on public.padoka_sales from authenticated;
grant select on public.padoka_sales to authenticated;

revoke all on public.padoka_sale_items from anon;
revoke insert, update, delete, truncate, references, trigger
  on public.padoka_sale_items from authenticated;
grant select on public.padoka_sale_items to authenticated;

drop policy if exists "padoka staff read sales" on public.padoka_sales;
drop policy if exists "padoka management read sales" on public.padoka_sales;

create policy "padoka management read sales"
on public.padoka_sales
for select
to authenticated
using (
  (select public.padoka_staff_has_role(array['owner','manager']::text[]))
);

drop policy if exists "padoka staff read sale items" on public.padoka_sale_items;
drop policy if exists "padoka management read sale items" on public.padoka_sale_items;

create policy "padoka management read sale items"
on public.padoka_sale_items
for select
to authenticated
using (
  (select public.padoka_staff_has_role(array['owner','manager']::text[]))
);
