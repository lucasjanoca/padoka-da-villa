-- PADOKA DA VILLA — fonte única do código de barras no estoque
-- Mantém o barcode em padoka_inventory, que já era a estrutura operacional oficial.

update public.padoka_inventory i
set barcode = p.barcode,
    updated_at = now()
from public.padoka_products p
where i.product_id = p.id
  and p.barcode is not null
  and btrim(p.barcode) <> ''
  and (i.barcode is null or btrim(i.barcode) = '');

drop function if exists public.padoka_link_product_barcode(text,text);
drop index if exists public.padoka_products_barcode_unique;
alter table public.padoka_products drop column if exists barcode;

create or replace function public.padoka_link_product_barcode(
  p_product_id text,
  p_barcode text
) returns public.padoka_inventory
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product_id text;
  v_barcode text;
  v_result public.padoka_inventory;
begin
  if not public.padoka_staff_has_role(array['owner','manager','cashier','attendant','stock']) then
    raise exception 'padoka barcode management permission required';
  end if;

  v_product_id := trim(coalesce(p_product_id,''));
  v_barcode := trim(coalesce(p_barcode,''));

  if v_product_id = '' then
    raise exception 'product id required';
  end if;

  if v_barcode = '' or length(v_barcode) > 128 or v_barcode !~ '^[[:graph:]]{1,128}$' then
    raise exception 'invalid barcode';
  end if;

  if not exists(
    select 1 from public.padoka_products p
    where p.id = v_product_id and p.active = true
  ) then
    raise exception 'unknown or inactive product';
  end if;

  insert into public.padoka_inventory(product_id,barcode,updated_by,updated_at)
  values(v_product_id,v_barcode,auth.uid(),now())
  on conflict (product_id) do update
  set barcode = excluded.barcode,
      updated_by = auth.uid(),
      updated_at = now()
  returning * into v_result;

  return v_result;
exception
  when unique_violation then
    raise exception 'barcode already linked';
end;
$$;

revoke all on function public.padoka_link_product_barcode(text,text) from public, anon;
grant execute on function public.padoka_link_product_barcode(text,text) to authenticated;
