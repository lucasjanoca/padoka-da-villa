-- PADOKA DA VILLA — trilha de auditoria do catálogo de produtos
-- Backend alvo exclusivo: Sites De Clientes! (yncspxfsvlqdnodlsosb)
-- NÃO aplicar no projeto InfoTech.io.
-- Depende de 017 (padoka_save_product / gestão autoritativa do catálogo).
-- Não cria trigger em auth.users e não concede escrita direta aos clientes/funcionários.

create table if not exists public.padoka_product_audit (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.padoka_products(id) on delete restrict,
  action text not null check (action in ('added','updated')),
  before_state jsonb,
  after_state jsonb not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.padoka_product_audit enable row level security;

-- A tabela fica inacessível por escrita/leitura direta para authenticated/anon.
-- Leitura administrativa acontece somente pela RPC SECURITY DEFINER abaixo.
revoke all on public.padoka_product_audit from anon, authenticated;

create or replace function public.padoka_product_state(p public.padoka_products)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'id', p.id,
    'name', p.name,
    'category', p.category,
    'price', p.price,
    'active', p.active,
    'is_demo', p.is_demo,
    'sort_order', p.sort_order
  );
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
  v_before public.padoka_products;
  v_result public.padoka_products;
  v_changed boolean := false;
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

  -- Serializa alterações do mesmo produto e captura o estado anterior para auditoria.
  select * into v_before
  from public.padoka_products
  where id = v_id
  for update;

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

  if v_before.id is null then
    insert into public.padoka_product_audit(product_id,action,before_state,after_state,actor_user_id)
    values(v_result.id,'added',null,public.padoka_product_state(v_result),auth.uid());
  else
    v_changed :=
      v_before.name is distinct from v_result.name or
      v_before.category is distinct from v_result.category or
      v_before.price is distinct from v_result.price or
      v_before.active is distinct from v_result.active or
      v_before.is_demo is distinct from v_result.is_demo or
      v_before.sort_order is distinct from v_result.sort_order;

    if v_changed then
      insert into public.padoka_product_audit(product_id,action,before_state,after_state,actor_user_id)
      values(v_result.id,'updated',public.padoka_product_state(v_before),public.padoka_product_state(v_result),auth.uid());
    end if;
  end if;

  return v_result;
end;
$$;

create or replace function public.padoka_list_product_audit(p_limit integer default 50)
returns table (
  id uuid,
  product_id text,
  product_name text,
  action text,
  before_state jsonb,
  after_state jsonb,
  actor_user_id uuid,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer;
begin
  if not public.padoka_staff_has_role(array['owner','manager']) then
    raise exception 'padoka product audit permission required';
  end if;

  v_limit := least(greatest(coalesce(p_limit,50),1),100);

  return query
  select
    a.id,
    a.product_id,
    coalesce(a.after_state->>'name', p.name, a.product_id) as product_name,
    a.action,
    a.before_state,
    a.after_state,
    a.actor_user_id,
    a.created_at
  from public.padoka_product_audit a
  left join public.padoka_products p on p.id = a.product_id
  order by a.created_at desc, a.id desc
  limit v_limit;
end;
$$;

revoke all on function public.padoka_product_state(public.padoka_products) from public, anon, authenticated;
revoke all on function public.padoka_save_product(text,text,text,numeric,boolean,boolean,integer) from public, anon;
grant execute on function public.padoka_save_product(text,text,text,numeric,boolean,boolean,integer) to authenticated;
revoke all on function public.padoka_list_product_audit(integer) from public, anon;
grant execute on function public.padoka_list_product_audit(integer) to authenticated;

create index if not exists padoka_product_audit_product_created_idx
on public.padoka_product_audit(product_id, created_at desc);

create index if not exists padoka_product_audit_created_idx
on public.padoka_product_audit(created_at desc);