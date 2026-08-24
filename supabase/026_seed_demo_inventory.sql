-- PADOKA DA VILLA — estoque de demonstração para testes do PDV
-- Só altera produtos ativos marcados como is_demo e apenas quando o estoque está zerado.
-- Na implantação real, esses valores serão substituídos pelo estoque informado pela padaria.

update public.padoka_inventory i
set quantity = 100,
    updated_at = now()
from public.padoka_products p
where p.id = i.product_id
  and p.active = true
  and p.is_demo = true
  and i.quantity = 0;
