# 2026-08-21 15:31 — Auditoria das alterações do catálogo preparada

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `DEPLOYMENT.md`, a migration 003, a gestão de produtos 017 e o frontend `assets/product-management.js` antes da alteração.
- Confirmado novamente pelo conector Supabase que a conexão disponível expõe somente **InfoTech.io**. Nenhuma query, migration, advisor ou alteração foi executada nesse projeto.
- Criada `supabase/018_product_catalog_audit.sql`, destinada exclusivamente ao backend **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`).
- A migration cria `padoka_product_audit`, isolada pelo prefixo `padoka_`, com RLS habilitado e sem privilégios diretos para `anon` ou `authenticated`.
- `padoka_save_product` passa a capturar o estado anterior do produto com lock de linha e registra evento `added` ou `updated` somente quando há mudança efetiva em nome, categoria, preço, visibilidade, estado provisório ou ordem.
- A trilha registra `before_state`, `after_state`, `actor_user_id` e horário, sem trigger global em `auth.users` e sem apagar histórico de produtos.
- Criada a RPC `padoka_list_product_audit`, limitada a no máximo 100 eventos e restrita internamente a `owner/manager`.
- Criado `tests/product-audit-trail-audit.mjs` para verificar RLS, ausência de acesso direto, lock, estados anterior/posterior, autor, ausência de eventos vazios e proibição de trigger global.
- `tests/migration-chain-audit.mjs` foi ampliado para exigir cadeia contínua `001→018` e os objetos esperados da migration 018.
- O workflow `.github/workflows/padoka-audit.yml` agora valida sintaxe e executa a auditoria da trilha de catálogo.
- A migration 018 permanece apenas preparada no repositório. Antes de aplicá-la no backend correto, devem ser aplicadas/revisadas as migrations anteriores na ordem definida e executados os advisors de Security/Performance após a alteração de banco.
