-- PADOKA: restrict direct inventory reads to roles that actually need them.
-- PDV still reads barcode metadata from padoka_inventory during bootstrap, so
-- cashier/attendant remain allowed until that legacy dependency is removed.

drop policy if exists "padoka staff read inventory" on public.padoka_inventory;

create policy "padoka inventory roles read inventory"
on public.padoka_inventory
for select
to authenticated
using (
  (select public.padoka_staff_has_role(array['owner','manager','stock','cashier','attendant']::text[]))
);
