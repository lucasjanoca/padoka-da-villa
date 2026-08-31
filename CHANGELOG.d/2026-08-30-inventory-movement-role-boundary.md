# 2026-08-30 — Histórico de estoque com leitura por função

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` e confirmado o `main` atual antes da mudança.
- Confirmado no Supabase correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) que o projeto está `ACTIVE_HEALTHY`; o projeto InfoTech.io não foi alterado.
- Revisadas as RLS e grants atuais antes de qualquer DDL: `padoka_inventory_movements` tinha RLS ativa e `SELECT` para `authenticated`, mas a policy permitia leitura a qualquer funcionário PADOKA ativo via `padoka_is_staff()`.
- Confirmado que o runtime atual não consulta diretamente `padoka_inventory_movements`; por isso o endurecimento desta tabela não interfere nos fluxos atuais de Caixa, Produção, Estoque ou relatórios.
- Criada/aplicada `060_inventory_movement_read_role_boundary.sql`: a leitura direta do histórico de movimentações agora exige papel `owner`, `manager` ou `stock` por `padoka_staff_has_role(...)`.
- `anon` continua sem privilégios na tabela; `authenticated` mantém somente `SELECT`, sem `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES` ou `TRIGGER`. As gravações continuam sendo feitas pelas operações autoritativas do backend.
- A policy e os grants foram consultados novamente após a migration e confirmaram o estado de menor privilégio esperado.
- O Security Advisor foi executado depois da alteração e não retornou aviso relacionado à PADOKA. Avisos existentes de objetos `rass_*` e a configuração global de proteção contra senhas vazadas foram apenas observados e permaneceram intocados, conforme o isolamento do projeto compartilhado.
- Adicionada `tests/inventory-movement-role-boundary-audit.mjs` para impedir regressão da policy/grants no histórico de estoque.
- Nenhum trigger em `auth.users` foi criado e nenhum objeto não-`padoka_` foi alterado.
