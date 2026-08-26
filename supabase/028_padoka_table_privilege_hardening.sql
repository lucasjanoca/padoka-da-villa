-- PADOKA DA VILLA — least-privilege hardening for browser roles.
-- Backend alvo exclusivo: Sites De Clientes! (yncspxfsvlqdnodlsosb)
-- Mantém RLS como controle por linha e remove capacidades de tabela que o navegador não precisa.
-- Escritas internas continuam pelas RPCs auditadas, com verificações explícitas de autenticação/cargo.

revoke insert, update, delete, truncate, references, trigger
  on table public.padoka_order_events from authenticated;

revoke truncate, references, trigger
  on table public.padoka_order_items from authenticated;

revoke truncate, references, trigger
  on table public.padoka_orders from authenticated;

revoke truncate, references, trigger
  on table public.padoka_products from anon, authenticated;

revoke delete, truncate, references, trigger
  on table public.padoka_profiles from authenticated;

revoke insert, update, delete, truncate, references, trigger
  on table public.padoka_sale_items from authenticated;

revoke insert, update, delete, truncate, references, trigger
  on table public.padoka_sales from authenticated;

revoke truncate, references, trigger
  on table public.padoka_staff_audit from authenticated;

revoke truncate, references, trigger
  on table public.padoka_staff_users from authenticated;
