# 2026-08-28 02:25 — Gestão operacional revalida sessão em troca de funcionário

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` no estado atual da `main` antes da alteração.
- Confirmado que o backend documentado continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que nenhuma alteração de banco seria necessária nesta rodada.
- Identificado que `assets/operational-sync.js`, responsável por estoque, planejamento de produção e resumo de perdas, mantinha dados e o canal Realtime ativos após a inicialização sem acompanhar logout/troca de identidade na mesma aba.
- O módulo agora observa `onAuthStateChange`, limpa imediatamente os dados operacionais renderizados, remove o canal Realtime anterior e invalida respostas assíncronas antigas por `lifecycleEpoch`.
- A reativação espera o guard global `padoka-staff-pending`/`padoka-role-pending` terminar e confirma que a sessão atual ainda pertence ao mesmo `user_id` antes de consultar ou renderizar dados novamente.
- Metadados de estoque, ajuste idempotente e planejamento reconfirmam a mesma sessão depois da RPC antes de mostrar sucesso, reabilitar controles ou recarregar dados.
- Quando a identidade muda, a tentativa pendente `padoka_pending_inventory_adjustment_v1` é removida para impedir que outro funcionário herde um retry iniciado pela conta anterior.
- O canal Realtime e a subscription de Auth também são encerrados no `pagehide`.
- `tests/operational-inventory-audit.mjs` foi ampliado para exigir lifecycle de Auth, invalidação por identidade, espera do guard interno, limpeza de Realtime e isolamento da tentativa pendente.
- Nenhum HTML/CSS, migration, RLS, grant ou Edge Function foi alterado; não houve ampliação de acesso e nenhum objeto fora de `padoka_` foi tocado.
