-- PADOKA DA VILLA — catálogo seguro de códigos de barras para o PDV
-- Fonte oficial: padoka_inventory.barcode

create or replace function public.padoka_list_product_barcodes()
returns table (
  product_id text,
  barcode text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.padoka_is_staff() then
    raise exception 'padoka staff permission required';
  end if;

  return query
  select i.product_id, i.barcode
  from public.padoka_inventory i
  join public.padoka_products p on p.id = i.product_id
  where p.active = true
    and i.barcode is not null
    and btrim(i.barcode) <> ''
  order by i.product_id;
end;
$$;

revoke all on function public.padoka_list_product_barcodes() from public, anon;
grant execute on function public.padoka_list_product_barcodes() to authenticated;
