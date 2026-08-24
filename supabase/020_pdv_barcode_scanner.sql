-- PADOKA DA VILLA — leitura de código de barras no PDV
-- Backend alvo exclusivo: Sites De Clientes! (yncspxfsvlqdnodlsosb)
-- Adiciona um código de barras opcional ao catálogo e uma RPC segura para vinculação.

alter table public.padoka_products
  add column if not exists barcode text;

create unique index if not exists padoka_products_barcode_unique
  on public.padoka_products(barcode)
  where barcode is not null and btrim(barcode) <> '';

create or replace function public.padoka_link_product_barcode(
  p_product_id text,
  p_barcode text
) returns public.padoka_products
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product_id text;
  v_barcode text;
  v_result public.padoka_products;
begin
  if not public.padoka_staff_has_role(array['owner','manager','cashier','attendant']) then
    raise exception 'padoka barcode management permission required';
  end if;

  v_product_id := trim(coalesce(p_product_id,''));
  v_barcode := trim(coalesce(p_barcode,''));

  if v_product_id = '' then
    raise exception 'product id required';
  end if;

  if v_barcode = '' or length(v_barcode) > 64 or v_barcode !~ '^[[:graph:]]{1,64}$' then
    raise exception 'invalid barcode';
  end if;

  update public.padoka_products
  set barcode = v_barcode,
      updated_at = now()
  where id = v_product_id
    and active = true
  returning * into v_result;

  if v_result.id is null then
    raise exception 'unknown or inactive product';
  end if;

  return v_result;
exception
  when unique_violation then
    raise exception 'barcode already linked';
end;
$$;

revoke all on function public.padoka_link_product_barcode(text,text) from public, anon;
grant execute on function public.padoka_link_product_barcode(text,text) to authenticated;
