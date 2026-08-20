# 2026-08-20 13:31 — Registro de perdas ganha retry idempotente

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `assets/operational-sync.js`, `assets/production-completion.js`, `supabase/003_operational_inventory_production_losses.sql` e o workflow de auditoria antes da alteração.
- Confirmado novamente que a conexão Supabase disponível expõe somente **InfoTech.io**; nenhuma query, migration, advisor ou alteração foi executada nesse projeto. O backend correto continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`).
- Identificado um risco no fluxo preparado de perdas: a RPC original da migration 003 é transacional, mas não possui chave idempotente. Se a rede cair depois de o servidor concluir a baixa, um retry manual poderia descontar o estoque novamente.
- Criada `supabase/007_loss_idempotency.sql`, dependente da migration 003, adicionando `request_id` único em `padoka_losses` e a RPC `padoka_register_loss_once`.
- A nova RPC valida staff, produto, quantidade, motivo e observação, faz lock da linha de estoque, rejeita saldo insuficiente e grava perda + movimento de estoque na mesma transação.
- Repetir o mesmo `request_id` com exatamente os mesmos dados devolve a perda já existente; reutilizar o identificador com produto, quantidade, motivo ou observação diferentes gera conflito.
- Criado `assets/loss-registration.js`. Ele só assume o botão **Registrar perda** quando detecta a coluna `request_id`; antes disso o fallback existente continua preservado para não quebrar a versão publicada.
- Em resposta de rede ambígua, a operação pendente fica em `sessionStorage`, o formulário é travado e **Tentar novamente** usa o mesmo `request_id` e os mesmos dados, evitando dupla baixa por retry.
- O novo frontend não escreve diretamente em `padoka_inventory`; a baixa continua exclusiva da RPC.
- `assets/internal-nav.js` passou a carregar o módulo de perdas somente dentro de `gestao.html`.
- Criado `tests/loss-transaction-audit.mjs` e adicionado ao workflow `.github/workflows/padoka-audit.yml` para proteger idempotência, lock, permissões e ausência de trigger global em `auth.users`.
- `README.md` atualizado para documentar as migrations 006/007 e a estratégia de ativação condicional.
- Como nenhuma mudança foi aplicada no banco PADOKA nesta execução, não havia advisor de segurança do backend correto para executar.
