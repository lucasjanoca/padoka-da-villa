-- PADOKA DA VILLA — remove policies legadas de escrita direta em perfis
-- Backend alvo exclusivo: Sites De Clientes! (yncspxfsvlqdnodlsosb)
-- NÃO aplicar no projeto InfoTech.io.

alter table public.padoka_profiles enable row level security;

-- O onboarding real já grava exclusivamente via public.padoka_save_profile(...).
-- authenticated não possui INSERT/UPDATE direto; estas policies antigas apenas
-- mantinham um caminho latente que poderia reaparecer se grants fossem ampliados.
drop policy if exists "padoka_customer_create_own_profile" on public.padoka_profiles;
drop policy if exists "padoka_customer_update_own_profile" on public.padoka_profiles;

revoke insert, update, delete on table public.padoka_profiles from anon, authenticated;

-- Leitura permanece controlada pelas policies atuais; nenhuma permissão é ampliada.
