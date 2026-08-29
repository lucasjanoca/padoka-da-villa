# 2026-08-29 18:30 — Navegação interna falha fechada em erro de sessão

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` no HEAD atual antes da alteração.
- Confirmado que a PADOKA continua vinculada exclusivamente ao projeto Supabase **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o projeto InfoTech.io não faz parte deste runtime.
- Revisado `assets/internal-nav.js`, responsável pelo guard global das áreas internas e pela resolução de papel em `padoka_staff_users`.
- Identificado que as duas leituras de `auth.getSession()` dependiam do `try/catch` externo e não tratavam explicitamente o campo `error` retornado pelo Supabase Auth.
- Criado `safeSession(client)`, que captura tanto rejeições de transporte quanto erros retornados pelo Auth e converte falha de confirmação em sessão ausente.
- A validação inicial e a revalidação posterior à leitura de `padoka_staff_users` agora usam `safeSession`; a interface continua sob `padoka-staff-pending`/`padoka-role-pending` quando a identidade não pode ser confirmada.
- Nenhuma permissão foi ampliada: o papel continua vindo de `padoka_staff_users`, módulos restritos continuam filtrados por role e respostas assíncronas antigas continuam invalidadas por `staffValidationEpoch`.
- `tests/staff-navigation-audit.mjs` passou a exigir leitura segura de sessão, tratamento do `error` do Auth e uso da confirmação fail-closed antes e depois da consulta de staff.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada nesta execução; não houve motivo para alterar ou consultar objetos não-`padoka_`.
