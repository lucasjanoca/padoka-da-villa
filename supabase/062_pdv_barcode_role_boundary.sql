-- PADOKA DA VILLA — restringe catálogo de códigos do PDV aos papéis que operam caixa

create or replace function padoka_private.padoka_list_product_barcodes()
returns table (
  product_id text,
  barcode text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'authentication required';
  end if;

  if not public.padoka_staff_has_role(array['owner','manager','cashier','attendant']) then
    raise exception 'padoka pdv permission required';
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

revoke all on function padoka_private.padoka_list_product_barcodes() from public, anon;
grant execute on function padoka_private.padoka_list_product_barcodes() to authenticated;
