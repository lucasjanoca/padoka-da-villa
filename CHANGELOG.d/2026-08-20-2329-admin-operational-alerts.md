# 2026-08-20 23:29 — Alertas operacionais no painel administrativo

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `internal.html`, `assets/admin-dashboard-live.js`, `tests/admin-dashboard-audit.mjs` e a migration operacional 003 antes da alteração.
- O painel administrativo continua exigindo sessão real e registro ativo em `padoka_staff_users`; nenhum acesso de Caixa, Estoque, Produção ou Administração foi exposto ao cliente público.
- `assets/admin-dashboard-live.js` agora detecta de forma condicional a existência de `padoka_inventory` e `padoka_production_plans` no backend correto.
- Quando a camada operacional estiver disponível, a Visão geral passa a mostrar um bloco `Alertas operacionais` com quantidade de produtos abaixo/igual ao estoque mínimo e planos de produção pendentes do dia.
- A lista de estoque baixo exibe no máximo cinco itens e usa o nome vindo de `padoka_products`, com sanitização antes de inserir conteúdo no HTML.
- O novo bloco é somente leitura: não há `insert`, `update`, `delete` ou `upsert` em estoque/produção pelo dashboard.
- Estoque e produção ganham atualização por Supabase Realtime apenas depois que a leitura inicial confirma que as tabelas existem.
- Se a migration 003 ainda não estiver aplicada, erros de tabela/schema ausente são tratados como camada indisponível e o bloco não é exibido, preservando a versão publicada sem simular dados.
- `tests/admin-dashboard-audit.mjs` foi ampliado para exigir leitura real de estoque/produção, comparação com `min_quantity`, tolerância à migration ausente, Realtime e proibição de escrita/estado local.
- Nenhuma migration, RLS ou objeto de banco foi alterado nesta execução; portanto não havia advisor PADOKA novo para executar.
- O projeto **InfoTech.io** não foi alterado.