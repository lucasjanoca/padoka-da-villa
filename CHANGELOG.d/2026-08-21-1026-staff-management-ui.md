# 2026-08-21 10:26 — Gestão de equipe preparada para owner

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração.
- Confirmado novamente que o backend correto da PADOKA é `Sites De Clientes!` (`yncspxfsvlqdnodlsosb`) e que a conexão Supabase disponível nesta execução expõe somente **InfoTech.io**; nenhuma query, migration, advisor ou alteração foi executada nesse projeto.
- A migration `014_staff_management_rpc.sql`, ainda não aplicada, foi refinada para que `padoka_list_staff()` retorne nome de exibição e e-mail do usuário Auth exclusivamente para `owner`, sem criar perfil PADOKA automático e sem trigger em `auth.users`.
- Criado `assets/staff-management.js`, carregado somente dentro de `gestao.html` e ativado apenas quando o usuário interno é `owner` e a RPC `padoka_list_staff` realmente existe no backend.
- Quando a camada 014 estiver disponível, a Gestão ganha a aba **Equipe**, com quantidade total, ativos, proprietários ativos, função e estado de acesso dos funcionários já existentes.
- Alterações usam exclusivamente `padoka_update_staff`; o frontend não faz `insert/update/delete` direto em `padoka_staff_users`.
- O owner atual não recebe controles para remover/rebaixar o próprio acesso; a proteção definitiva do último owner continua sendo validada pela RPC no servidor.
- A interface recebe atualizações por Supabase Realtime e sanitiza nome/e-mail antes de inserir os dados no HTML.
- Se a migration 014 ainda não existir, a aba não é criada; acesso manual a `?tab=equipe` volta para Configurações, evitando uma tela interna quebrada.
- Criado `tests/staff-management-frontend-audit.mjs` e adicionado ao workflow `padoka-audit.yml`.
- A tentativa de executar os testes locais diretamente a partir do GitHub ficou bloqueada por falha de DNS para `raw.githubusercontent.com`; o GitHub ainda não apresentou status de CI para o commit final, portanto a execução remota não foi marcada como aprovada sem evidência.
