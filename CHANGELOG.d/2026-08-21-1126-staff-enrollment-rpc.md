# 2026-08-21 11:26 — Inclusão segura de funcionário existente preparada

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `DEPLOYMENT.md`, a migration 014 e a interface atual de gestão de equipe antes da alteração.
- Confirmado novamente que o backend correto continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o conector Supabase disponível nesta execução expõe somente **InfoTech.io**; nenhuma query, migration, advisor ou alteração foi executada nesse projeto.
- Criada `supabase/015_staff_enrollment_rpc.sql`, destinada exclusivamente ao backend PADOKA e dependente das migrations 003/014.
- A nova RPC `padoka_add_staff_by_email` só pode concluir a operação quando o chamador é `owner` PADOKA e o e-mail informado corresponde a uma identidade real já existente em `auth.users`.
- A operação não cria usuário Auth, não cria `padoka_profiles`, não cria trigger global em `auth.users` e não altera automaticamente usuários de outros sistemas do Supabase compartilhado.
- Funções aceitas permanecem restritas a `owner`, `manager`, `cashier`, `attendant`, `production` e `stock`; cadastro duplicado em `padoka_staff_users` é rejeitado.
- `anon/public` não recebem execução da RPC. `authenticated` recebe apenas o direito de chamar a função, que revalida `owner` no servidor antes de qualquer inclusão.
- Criado `tests/staff-enrollment-audit.mjs` para verificar isolamento, permissões, ausência de escrita em `auth`, ausência de criação de perfil cliente e ausência de trigger global.
- `tests/migration-chain-audit.mjs` passou a exigir cadeia contínua `001→015` e os objetos críticos da nova migration.
- O workflow `PADOKA Static Audit` foi atualizado para validar sintaxe e executar a nova auditoria.
- `DEPLOYMENT.md` agora inclui a migration 015, o gate específico de validação e deixa explícito que ela associa somente uma identidade Auth já existente; não é fluxo público de convite/criação de conta.
- A migration 015 ficou apenas preparada no repositório. Não foi aplicada no Supabase correto porque essa conexão ainda não está disponível nesta sessão.
