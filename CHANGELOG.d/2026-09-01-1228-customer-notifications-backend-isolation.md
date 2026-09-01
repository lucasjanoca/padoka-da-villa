# 2026-09-01 12:28 — Notificações do cliente presas ao backend PADOKA

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração; o backend correto permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e o projeto InfoTech.io não foi alterado.
- Identificado que `assets/customer-notifications.js` aceitava diretamente a instância Supabase publicada pelo evento global `padoka:supabase-ready`; o runtime principal já fixa o projeto correto, mas a central não fazia uma segunda validação própria.
- A central agora fixa `https://yncspxfsvlqdnodlsosb.supabase.co` e valida `candidate.supabaseUrl` antes de vincular sessão, consultas ou Realtime. Instâncias de outro projeto falham fechadas e são ignoradas.
- Permanecem preservados o filtro explícito por `user_id`, a revalidação de sessão/lifecycle, o canal Realtime filtrado por cliente e o uso exclusivo da RPC `padoka_mark_customer_notifications_read` para marcação de leitura.
- Criado `tests/customer-notifications-backend-isolation-audit.mjs` para impedir regressão no pinning do backend, no escopo por usuário e na ausência de credenciais administrativas no frontend.
- Nenhuma migration, RLS, policy, grant, trigger ou Edge Function foi alterada nesta execução; não houve ampliação de privilégios nem alteração em objetos não-`padoka_`.
