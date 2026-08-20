-- PADOKA DA VILLA — resumo operacional seguro para relatórios internos
-- Backend alvo exclusivo: Sites De Clientes! (yncspxfsvlqdnodlsosb)
-- NÃO aplicar no projeto InfoTech.io.
-- DEPENDE das migrations operacionais 003/004 já aplicadas.
-- Não cria trigger em auth.users e mantém todos os objetos exclusivos com prefixo padoka_.

create or replace function public.padoka_report_summary(
  p_from date default null,
  p_to date default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := timezone('America/Sao_Paulo', now())::date;
  v_from date := coalesce(p_from, timezone('America/Sao_Paulo', now())::date);
  v_to date := coalesce(p_to, timezone('America/Sao_Paulo', now())::date);
  v_sales_count bigint;
  v_sales_total numeric(14,2);
  v_test_sales_count bigint;
  v_test_sales_total numeric(14,2);
  v_orders_count bigint;
  v_orders_open bigint;
  v_orders_ready bigint;
  v_orders_completed bigint;
  v_orders_cancelled bigint;
  v_test_orders_count bigint;
  v_loss_count bigint;
  v_loss_quantity numeric(14,3);
  v_planned_quantity numeric(14,3);
  v_produced_quantity numeric(14,3);
  v_low_stock_count bigint;
  v_with_stock_count bigint;
  v_missing_barcode_count bigint;
  v_top_products jsonb;
begin
  if not public.padoka_staff_has_role(array['owner','manager']) then
    raise exception 'padoka report permission required';
  end if;

  if v_to < v_from then raise exception 'invalid report range'; end if;
  if (v_to - v_from) > 31 then raise exception 'report range too large'; end if;
  if v_to > v_today + 1 then raise exception 'future report range not allowed'; end if;

  select
    count(*),
    coalesce(round(sum(s.total),2),0),
    count(*) filter (where s.is_test),
    coalesce(round(sum(s.total) filter (where s.is_test),2),0)
  into v_sales_count,v_sales_total,v_test_sales_count,v_test_sales_total
  from public.padoka_sales s
  where s.status = 'completed'
    and timezone('America/Sao_Paulo',s.created_at)::date between v_from and v_to;

  select
    count(*),
    count(*) filter (where o.status not in ('completed','cancelled')),
    count(*) filter (where o.status = 'ready'),
    count(*) filter (where o.status = 'completed'),
    count(*) filter (where o.status = 'cancelled'),
    count(*) filter (where o.is_test)
  into v_orders_count,v_orders_open,v_orders_ready,v_orders_completed,v_orders_cancelled,v_test_orders_count
  from public.padoka_orders o
  where timezone('America/Sao_Paulo',o.created_at)::date between v_from and v_to;

  select count(*),coalesce(sum(l.quantity),0)
  into v_loss_count,v_loss_quantity
  from public.padoka_losses l
  where timezone('America/Sao_Paulo',l.created_at)::date between v_from and v_to;

  select
    coalesce(sum(p.planned_quantity),0),
    coalesce(sum(p.produced_quantity),0)
  into v_planned_quantity,v_produced_quantity
  from public.padoka_production_plans p
  where p.plan_date between v_from and v_to;

  select
    count(*) filter (where i.min_quantity > 0 and i.quantity <= i.min_quantity),
    count(*) filter (where i.quantity > 0),
    count(*) filter (where i.barcode is null or btrim(i.barcode) = '')
  into v_low_stock_count,v_with_stock_count,v_missing_barcode_count
  from public.padoka_inventory i
  join public.padoka_products p on p.id = i.product_id and p.active = true;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'product_id',x.product_id,
      'product_name',x.product_name,
      'quantity',x.quantity,
      'revenue',x.revenue
    ) order by x.revenue desc,x.product_name
  ),'[]'::jsonb)
  into v_top_products
  from (
    select
      si.product_id,
      max(si.product_name) as product_name,
      sum(si.quantity)::numeric(14,3) as quantity,
      round(sum(si.line_total),2)::numeric(14,2) as revenue
    from public.padoka_sale_items si
    join public.padoka_sales s on s.id = si.sale_id and s.status = 'completed'
    where timezone('America/Sao_Paulo',s.created_at)::date between v_from and v_to
    group by si.product_id
    order by revenue desc,product_name
    limit 5
  ) x;

  return jsonb_build_object(
    'from',v_from,
    'to',v_to,
    'timezone','America/Sao_Paulo',
    'sales',jsonb_build_object(
      'count',v_sales_count,
      'total',v_sales_total,
      'test_count',v_test_sales_count,
      'test_total',v_test_sales_total
    ),
    'orders',jsonb_build_object(
      'count',v_orders_count,
      'open',v_orders_open,
      'ready',v_orders_ready,
      'completed',v_orders_completed,
      'cancelled',v_orders_cancelled,
      'test_count',v_test_orders_count
    ),
    'losses',jsonb_build_object(
      'count',v_loss_count,
      'quantity',v_loss_quantity
    ),
    'production',jsonb_build_object(
      'planned',v_planned_quantity,
      'produced',v_produced_quantity
    ),
    'inventory',jsonb_build_object(
      'low_stock',v_low_stock_count,
      'with_stock',v_with_stock_count,
      'missing_barcode',v_missing_barcode_count
    ),
    'top_products',v_top_products,
    'has_provisional_data',(v_test_sales_count > 0 or v_test_orders_count > 0)
  );
end;
$$;

revoke all on function public.padoka_report_summary(date,date) from public, anon;
grant execute on function public.padoka_report_summary(date,date) to authenticated;
