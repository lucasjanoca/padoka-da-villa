-- PADOKA: direct inventory reads are restricted to stock-management roles.
-- PDV barcode lookup is served by padoka_list_product_barcodes(), whose
-- server-side authorization remains limited to PDV-capable staff roles.

drop policy if exists "padoka inventory roles read inventory" on public.padoka_inventory;

create policy "padoka inventory roles read inventory"
on public.padoka_inventory
for select
to authenticated
using (
  (select public.padoka_staff_has_role(array['owner','manager','stock']::text[]))
);
