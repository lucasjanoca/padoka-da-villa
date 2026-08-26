-- PADOKA DA VILLA — gestão segura do catálogo de produtos
-- Backend alvo exclusivo: Sites De Clientes! (yncspxfsvlqdnodlsosb)
-- NÃO aplicar no projeto InfoTech.io.
-- Depende de 002 (padoka_products) e 003 (padoka_staff_has_role).
-- Não cria trigger em auth.users, não concede escrita pública e não apaga produtos.

create or replace function public.padoka_list_products_admin()
returns table (
  id text,
  name text,
  category text,
  price numeric,
  active boolean,
  is_demo boolean,
  sort_order integer,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.padoka_staff_has_role(array['owner','manager']) then
    raise exception 'padoka product management permission required';
  end if;

  return query
  select
    p.id,
    p.name,
    p.category,
    p.price,
    p.active,
    p.is_demo,
    p.sort_order,
    p.updated_at
  from public.padoka_products p
  order by p.sort_order, p.name, p.id;
end;
$$;

create or replace function public.padoka_save_product(
  p_id text,
  p_name text,
  p_category text,
  p_price numeric,
  p_active boolean,
  p_is_demo boolean,
  p_sort_order integer
) returns public.padoka_products
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text;
  v_name text;
  v_category text;
  v_result public.padoka_products;
begin
  if not public.padoka_staff_has_role(array['owner','manager']) then
    raise exception 'padoka product management permission required';
  end if;

  v_id := lower(trim(coalesce(p_id,'')));
  v_name := trim(coalesce(p_name,''));
  v_category := trim(coalesce(p_category,''));

  if v_id = '' or length(v_id) > 80 or v_id !~ '^[a-z0-9][a-z0-9_-]{0,79}$' then
    raise exception 'invalid product id';
  end if;
  if v_name = '' or length(v_name) > 120 then
    raise exception 'invalid product name';
  end if;
  if v_category = '' or length(v_category) > 60 then
    raise exception 'invalid product category';
  end if;
  if p_price is null or p_price < 0 or p_price > 999999.99 then
    raise exception 'invalid product price';
  end if;
  if p_active is null or p_is_demo is null then
    raise exception 'product flags required';
  end if;
  if p_sort_order is null or p_sort_order < 0 or p_sort_order > 1000000 then
    raise exception 'invalid product sort order';
  end if;

  insert into public.padoka_products(
    id,name,category,price,active,is_demo,sort_order,updated_at
  ) values (
    v_id,v_name,v_category,round(p_price,2),p_active,p_is_demo,p_sort_order,now()
  )
  on conflict (id) do update set
    name = excluded.name,
    category = excluded.category,
    price = excluded.price,
    active = excluded.active,
    is_demo = excluded.is_demo,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning * into v_result;

  return v_result;
end;
$$;

-- O catálogo continua publicamente legível apenas para itens ativos pela RLS da 002.
-- Escrita direta fica explicitamente revogada; alterações administrativas passam pela RPC.
revoke insert, update, delete on public.padoka_products from anon, authenticated;

revoke all on function public.padoka_list_products_admin() from public, anon;
grant execute on function public.padoka_list_products_admin() to authenticated;

revoke all on function public.padoka_save_product(text,text,text,numeric,boolean,boolean,integer) from public, anon;
grant execute on function public.padoka_save_product(text,text,text,numeric,boolean,boolean,integer) to authenticated;
