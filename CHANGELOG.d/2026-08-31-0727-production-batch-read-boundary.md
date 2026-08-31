## 2026-08-31 07:27 — Histórico de produção passa a obedecer papel operacional

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` e confirmado o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); o projeto InfoTech.io não foi alterado.
- Antes do DDL, confirmado que `padoka_production_batches` já tinha RLS ativa, `anon` sem `SELECT`, `authenticated` somente com `SELECT` e sem privilégios diretos de escrita.
- Identificado que a policy de leitura ainda aceitava qualquer funcionário ativo via `padoka_is_staff()`, apesar de o runtime de conclusão/reconciliação de produção ser limitado a `owner`, `manager` e `production`.
- Criada e aplicada a migration `065_production_batch_read_role_boundary.sql`: a leitura direta de `padoka_production_batches` agora exige `padoka_staff_has_role(array['owner','manager','production'])`.
- `stock`, `cashier`, `attendant` e demais papéis não recebem acesso ao histórico de lotes apenas por serem staff; nenhum grant de escrita foi ampliado.
- Adicionada `tests/production-batch-read-role-boundary-audit.mjs`, que exige RLS, privilégios mínimos, a policy por papel e a correspondência com os papéis aceitos em `assets/production-completion.js`.
- O gate `Run every PADOKA audit` passou antes da aplicação no banco.
- Após a migration, a policy e os grants foram conferidos novamente: RLS continua ativa, `anon_select=false`, `authenticated` mantém somente leitura e a policy usa exclusivamente `owner/manager/production`.
- Security Advisors foram executados antes e depois da alteração; nenhum aviso relacionado à PADOKA foi criado. Avisos existentes de objetos `rass_*` e da configuração global de proteção contra senhas vazadas permaneceram intocados.
- Não foi criado trigger em `auth.users`, não foram alterados objetos não-`padoka_`, secrets, Edge Functions ou fluxos públicos do cliente.
