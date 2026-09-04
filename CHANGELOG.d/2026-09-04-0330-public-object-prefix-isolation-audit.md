# 2026-09-04 03:30 — Auditoria global do prefixo de objetos públicos

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` e revisado o HEAD atual antes da alteração.
- Confirmado novamente que o backend correto da PADOKA permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); o projeto InfoTech.io não foi alterado.
- Reforçado `tests/backend-isolation-audit.mjs` para inspecionar toda migration `supabase/*.sql` e rejeitar criação de `table`, `function`, `view`, `materialized view`, `type` ou `sequence` em `public` quando o nome não começar por `padoka_`.
- A verificação roda sobre SQL executável após remoção de comentários, preservando documentação e evitando falso positivo em textos explicativos.
- A proteção anterior contra URLs de outro projeto Supabase e contra `CREATE TRIGGER ... ON auth.users` continua ativa; onboarding de cliente permanece explícito e staff continua separado em `padoka_staff_users`.
- O `PADOKA Static Audit #1370` passou no commit funcional, incluindo checagem de sintaxe e execução de todas as auditorias do projeto.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function, configuração de Auth/OAuth ou runtime de negócio foi alterado; portanto não houve mudança no banco e não foi necessário consultar Security Advisors nesta rodada.
