-- PADOKA DA VILLA — idempotência para vendas do Caixa / PDV
-- Backend alvo exclusivo: Sites De Clientes! (yncspxfsvlqdnodlsosb)
-- NÃO aplicar no projeto InfoTech.io.
-- DEPENDE das migrations 003 e 004.
-- Não cria trigger em auth.users e mantém todos os objetos exclusivos com prefixo padoka_.

alter table public.padoka_sales
add column if not exists request_id uuid;

create unique index if not exists padoka_sales_request_id_uidx
on public.padoka_sales(request_id)
where request_id is not null;

create or replace function public.padoka_create_sale_once(
  p_items jsonb,
  p_payment_method text,
  p_request_id uuid
) returns public.padoka_sales
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale public.padoka_sales;
  v_code text;
  v_total numeric(12,2);
  v_requested_count integer;
  v_valid_count integer;
  v_demo boolean;
  v_request_items jsonb;
  v_existing_items jsonb;
  r record;
begin
  if not public.padoka_staff_has_role(array['owner','manager','cashier','attendant']) then
    raise exception 'padoka pdv permission required';
  end if;

  if p_request_id is null then
    raise exception 'sale request id required';
  end if;

  if p_payment_method not in ('cash','pix','debit','credit','other') then
    raise exception 'invalid payment method';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'sale requires items';
  end if;
  if jsonb_array_length(p_items) > 100 then
    raise exception 'too many sale lines';
  end if;

  with requested as (
    select
      nullif(trim(x->>'product_id'),'') as product_id,
      case
        when (x->>'quantity') ~ '^[0-9]+([.][0-9]{1,3})?$' then (x->>'quantity')::numeric(12,3)
        else null
      end as quantity
    from jsonb_array_elements(p_items) x
  )
  select count(*), count(*) filter (
    where product_id is not null and quantity is not null and quantity > 0 and quantity <= 9999
  )
  into v_requested_count, v_valid_count
  from requested;

  if v_requested_count <> v_valid_count then
    raise exception 'invalid sale item';
  end if;

  with requested as (
    select trim(x->>'product_id') as product_id, (x->>'quantity')::numeric(12,3) as quantity
    from jsonb_array_elements(p_items) x
  ), grouped as (
    select product_id, sum(quantity)::numeric(12,3) as quantity
    from requested
    group by product_id
  )
  select jsonb_agg(
    jsonb_build_object('product_id',product_id,'quantity',quantity)
    order by product_id
  )
  into v_request_items
  from grouped;

  -- Serializa retries concorrentes do mesmo request_id antes de consultar/criar a venda.
  perform pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));

  select * into v_sale
  from public.padoka_sales
  where request_id = p_request_id;

  if found then
    if v_sale.cashier_user_id is distinct from auth.uid()
       or v_sale.payment_method is distinct from p_payment_method then
      raise exception 'sale request id conflict';
    end if;

    select jsonb_agg(
      jsonb_build_object('product_id',product_id,'quantity',quantity)
      order by product_id
    )
    into v_existing_items
    from public.padoka_sale_items
    where sale_id = v_sale.id;

    if coalesce(v_existing_items,'[]'::jsonb) is distinct from coalesce(v_request_items,'[]'::jsonb) then
      raise exception 'sale request id conflict';
    end if;

    return v_sale;
  end if;

  with requested as (
    select * from jsonb_to_recordset(v_request_items) as x(product_id text, quantity numeric)
  ), priced as (
    select r.product_id, r.quantity::numeric(12,3) as quantity, p.price, p.is_demo
    from requested r
    join public.padoka_products p on p.id = r.product_id and p.active = true
  )
  select
    count(*),
    coalesce(round(sum(quantity * price),2),0),
    coalesce(bool_or(is_demo),true)
  into v_valid_count, v_total, v_demo
  from priced;

  if v_valid_count <> jsonb_array_length(v_request_items) then
    raise exception 'unknown or inactive product';
  end if;
  if v_total <= 0 then
    raise exception 'invalid sale total';
  end if;

  -- Trava todas as linhas de estoque em ordem estável antes da baixa.
  for r in
    with requested as (
      select * from jsonb_to_recordset(v_request_items) as x(product_id text, quantity numeric)
    )
    select i.product_id, i.quantity as available, requested.quantity::numeric(12,3) as requested
    from requested
    join public.padoka_inventory i on i.product_id = requested.product_id
    order by i.product_id
    for update of i
  loop
    if r.available < r.requested then
      raise exception 'insufficient inventory for product %', r.product_id;
    end if;
  end loop;

  if jsonb_array_length(v_request_items) <> (
    with requested as (
      select * from jsonb_to_recordset(v_request_items) as x(product_id text, quantity numeric)
    )
    select count(*) from requested join public.padoka_inventory i using(product_id)
  ) then
    raise exception 'inventory not initialized for all products';
  end if;

  v_code := 'PDV-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));

  insert into public.padoka_sales(
    code,cashier_user_id,payment_method,subtotal,total,is_test,request_id
  ) values (
    v_code,auth.uid(),p_payment_method,v_total,v_total,v_demo,p_request_id
  )
  returning * into v_sale;

  with requested as (
    select * from jsonb_to_recordset(v_request_items) as x(product_id text, quantity numeric)
  )
  insert into public.padoka_sale_items(
    sale_id,product_id,product_name,quantity,unit_price,line_total
  )
  select v_sale.id,p.id,p.name,r.quantity::numeric(12,3),p.price,round(r.quantity * p.price,2)
  from requested r
  join public.padoka_products p on p.id = r.product_id and p.active = true;

  with requested as (
    select * from jsonb_to_recordset(v_request_items) as x(product_id text, quantity numeric)
  )
  update public.padoka_inventory i
  set quantity = i.quantity - r.quantity,
      updated_by = auth.uid(),
      updated_at = now()
  from requested r
  where i.product_id = r.product_id;

  insert into public.padoka_inventory_movements(
    product_id,delta,reason,source,reference_id,created_by
  )
  select si.product_id,-si.quantity,'Venda de balcão ' || v_sale.code,'sale',v_sale.id,auth.uid()
  from public.padoka_sale_items si
  where si.sale_id = v_sale.id;

  return v_sale;
end;
$$;

revoke all on function public.padoka_create_sale_once(jsonb,text,uuid) from public, anon;
grant execute on function public.padoka_create_sale_once(jsonb,text,uuid) to authenticated;

-- Compatibilidade: padoka_create_sale(jsonb,text) permanece disponível enquanto o
-- frontend publicado ainda não estiver migrado para request_id. Revogar a RPC antiga
-- somente depois da ativação e validação do novo fluxo no backend correto.
