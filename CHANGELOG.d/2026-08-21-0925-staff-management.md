## 2026-08-21 09:25 — Gestão de permissões internas preparada

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `DEPLOYMENT.md`, `assets/internal-nav.js` e as auditorias atuais antes da alteração.
- Confirmado novamente que o único Supabase conectado nesta execução é **InfoTech.io** (`rgngqumqzylthdiazvfu`); nenhuma migration, query ou advisor foi executado nele. O backend correto da PADOKA continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`).
- Criada `supabase/014_staff_management_rpc.sql`, destinada somente ao backend PADOKA e dependente da função `padoka_staff_has_role()` preparada na migration 003.
- A nova camada cria `padoka_list_staff()` e `padoka_update_staff(uuid,text,boolean)`, ambas `SECURITY DEFINER` com `search_path=public` e validação obrigatória de função `owner`.
- A atualização de staff aceita somente os papéis PADOKA já existentes (`owner`, `manager`, `cashier`, `attendant`, `production`, `stock`) e não cria funcionário novo silenciosamente: o alvo precisa já existir em `padoka_staff_users`.
- Adicionada proteção contra o owner remover o próprio acesso por engano e contra desativar/rebaixar o último owner ativo.
- A policy de leitura de `padoka_staff_users` foi preparada para que staff comum veja somente o próprio registro, enquanto owner pode listar a equipe; escrita direta `INSERT/UPDATE/DELETE` por `authenticated` fica revogada.
- `anon` não recebe acesso e nenhum trigger global em `auth.users` foi criado.
- `tests/migration-chain-audit.mjs` foi atualizado para exigir a cadeia contínua `001→014` e os objetos/proteções da nova migration.
- Criado `tests/staff-management-audit.mjs` e adicionado ao workflow `.github/workflows/padoka-audit.yml`.
- O teste específico novo passou localmente com `node --check` e `node tests/staff-management-audit.mjs` em um ambiente mínimo reproduzindo a migration criada.
- `DEPLOYMENT.md` agora inclui a migration 014, a ordem segura de aplicação e um gate específico para testar owner, staff comum, cliente e proteção do último owner antes de qualquer futura tela de gestão de usuários.
- Como nenhuma mudança foi aplicada no banco PADOKA nesta execução, não havia advisor do projeto correto disponível para executar.
