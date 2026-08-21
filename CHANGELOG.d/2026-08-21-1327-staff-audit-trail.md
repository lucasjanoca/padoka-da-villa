# 2026-08-21 13:27 — Auditoria de acessos da equipe preparada

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, migrations 014/015, `assets/staff-management.js`, a auditoria da cadeia e o guia `DEPLOYMENT.md` antes de continuar.
- Confirmado novamente pelo conector Supabase que a conexão disponível expõe somente **InfoTech.io**. Nenhuma query, migration, advisor ou alteração foi executada nesse projeto; o backend correto continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`).
- Criada `supabase/016_staff_audit_trail.sql`, destinada exclusivamente ao backend PADOKA correto.
- A migration cria `padoka_staff_audit` com RLS e leitura somente por `owner`; `authenticated` não recebe permissão de escrita direta na tabela e `anon` não recebe acesso.
- `padoka_update_staff` e `padoka_add_staff_by_email` foram preparados para registrar ator, alvo, função/estado anterior e novo dentro da mesma transação da alteração.
- Alteração sem mudança efetiva retorna o registro atual e não gera evento vazio.
- A proteção do último owner foi reforçada com `pg_advisory_xact_lock`, serializando mudanças administrativas concorrentes antes da contagem de proprietários ativos.
- Criada a RPC `padoka_list_staff_audit`, limitada a `owner`, com limite máximo de 100 eventos e nomes/e-mails obtidos da identidade Auth somente no servidor.
- Criado `assets/staff-audit.js`: quando a migration 016 existir, owners veem **Histórico de acessos** na aba Equipe; quando a RPC não existe, o módulo se remove silenciosamente e não quebra a Gestão publicada.
- `assets/internal-nav.js` passou a carregar o novo módulo somente em `gestao.html`.
- Criado `tests/staff-audit-trail-audit.mjs`, adicionada a migration 016 à auditoria contínua 001→016 e incluído o novo teste no workflow `PADOKA Static Audit`.
- `DEPLOYMENT.md` atualizado com a migration 016, smoke tests, proteção de concorrência e critérios de ativação.
- Não foi criada conta Auth, `padoka_profiles`, trigger global em `auth.users` nem qualquer objeto fora do prefixo `padoka_`.
- Como a migration 016 não foi aplicada no backend correto nesta execução, não havia advisors PADOKA novos para executar.
