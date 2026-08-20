# 2026-08-20 09:26 — Registro transacional de produção preparado

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `assets/operational-sync.js` e a migration operacional 003 antes da alteração.
- Confirmado novamente pelo conector Supabase que a única conexão disponível continua sendo **InfoTech.io** (`rgngqumqzylthdiazvfu`). Nenhuma query, migration, advisor ou alteração foi executada nesse projeto.
- Criada `supabase/006_production_completion_transaction.sql`, destinada exclusivamente ao backend **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e dependente da migration 003.
- A migration prepara `padoka_production_batches` e a RPC `padoka_record_production`, sem criar trigger global em `auth.users` e mantendo todos os objetos no namespace lógico `padoka_*`.
- `padoka_record_production` restringe o registro a `owner`, `manager` e `production`, exige plano existente/ativo, bloqueia planos cancelados ou concluídos e valida quantidade positiva.
- O registro de produção passa a ser preparado como uma única transação: incrementa `padoka_inventory`, atualiza `produced_quantity/status` do plano, grava o lote em `padoka_production_batches` e cria o movimento correspondente em `padoka_inventory_movements` com origem `production`.
- Cada operação usa `request_id` único. A função verifica idempotência antes e depois do lock do plano, reduzindo risco de duplicar estoque/produção por retry ou cliques concorrentes.
- A tabela de lotes permite somente leitura para `authenticated` sujeita a RLS de staff; não há `INSERT/UPDATE/DELETE` direto pelo frontend, e a RPC não é executável por `anon/public`.
- Criado `tests/production-transaction-audit.mjs` para auditar isolamento, RLS/permissões, idempotência, lock, incremento transacional de estoque e ausência de trigger global.
- `.github/workflows/padoka-audit.yml` foi atualizado para validar sintaxe e executar essa nova auditoria junto das verificações existentes.
- A migration 006 **não foi aplicada** no Supabase publicado. Antes de ativá-la, é necessário ter acesso ao projeto correto, aplicar/revisar a 003, executar advisors de segurança e só então aplicar/revisar a 006.
- O frontend publicado não foi ligado à nova RPC nesta execução, evitando expor um botão que ainda não funcionaria enquanto a migration não existir no backend correto.
