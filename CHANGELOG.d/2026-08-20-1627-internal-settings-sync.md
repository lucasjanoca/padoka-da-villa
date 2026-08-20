## 2026-08-20 16:27 — Configurações internas preparadas para sair do localStorage

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `gestao.html`, `assets/internal-nav.js` e a camada operacional antes da alteração.
- Criada `supabase/009_internal_settings.sql`, destinada exclusivamente ao backend **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e dependente da helper de papéis da migration 003.
- A migration cria `padoka_settings`, com RLS e leitura somente para staff PADOKA autenticado; escrita não é concedida diretamente à tabela.
- A RPC `padoka_get_settings` permite leitura apenas para equipe PADOKA e a RPC `padoka_update_settings` restringe alterações a `owner` e `manager`.
- Horários, forma de pagamento e observação são validados no servidor; a migration não inventa horários oficiais e cria somente a linha vazia `main` até uma alteração autorizada.
- Criado `assets/settings-sync.js`: quando a migration 009 existir, a aba Configurações passa a carregar/salvar pelo Supabase e recebe atualizações em tempo real; enquanto a RPC não existir, o comportamento atual permanece como fallback para não quebrar o publicado.
- `assets/internal-nav.js` passou a carregar essa sincronização somente dentro de `gestao.html`; nenhuma página pública ganhou acesso a Configurações.
- Criado `tests/settings-sync-audit.mjs` e incluído no workflow `.github/workflows/padoka-audit.yml`, cobrindo isolamento `padoka_`, RLS, permissões owner/manager, ausência de trigger em `auth.users`, uso das RPCs e proibição de `localStorage` na camada sincronizada.
- Nenhuma migration foi aplicada nesta execução; o projeto InfoTech.io não deve ser alterado. A migration 009 permanece somente preparada até que o backend PADOKA correto esteja disponível para escrita e revisão por advisors.
