-- PADOKA DA VILLA — códigos EAN-13 de teste usados no PDF do PDV
-- Mantém os códigos de teste vinculados aos produtos demonstrativos.

with codes(product_id, barcode) as (
  values
    ('pao-frances','7899000000010'),
    ('pao-queijo','7899000000027'),
    ('croissant','7899000000034'),
    ('croissant-recheado','7899000000041'),
    ('coxinha','7899000000058'),
    ('esfiha','7899000000065'),
    ('misto','7899000000072'),
    ('combo-noturno','7899000000089'),
    ('bolo','7899000000096'),
    ('sonho','7899000000102'),
    ('cookie','7899000000119'),
    ('muffin','7899000000126'),
    ('expresso','7899000000133'),
    ('cappuccino','7899000000140'),
    ('suco','7899000000157'),
    ('agua','7899000000164')
)
update public.padoka_inventory i
set barcode = c.barcode,
    updated_at = now()
from codes c
join public.padoka_products p on p.id = c.product_id and p.is_demo = true
where i.product_id = c.product_id
  and (i.barcode is distinct from c.barcode);
