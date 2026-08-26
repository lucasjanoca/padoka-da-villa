# 2026-08-27 — Gestão deixa de manter estado operacional local legado

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração e confirmada a continuidade no backend PADOKA **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`).
- Concluída a etapa principal da Issue #1: `gestao.html` não mantém mais `padoka_demo_stock`, `padoka_demo_production` ou `padoka_demo_losses`.
- Removidas as rotinas locais que liam/gravam estoque, produção e perdas em `localStorage`; o navegador não simula mais sucesso operacional quando o backend não está disponível.
- Estoque, produção e perdas agora iniciam visualmente bloqueados e passam a ser controlados exclusivamente por `assets/operational-sync.js`, carregado pela navegação interna depois da área autenticada.
- O formulário de perdas e as configurações também iniciam desabilitados; as camadas sincronizadas só liberam os controles após sessão/papel válidos e carregamento seguro do servidor.
- Preservadas as RPCs server-authoritative `padoka_adjust_inventory`, `padoka_update_inventory_metadata`, `padoka_upsert_production_plan` e `padoka_register_loss`; nenhuma permissão de banco foi ampliada.
- `tests/operational-fail-closed-audit.mjs` agora falha se os três fallbacks locais retornarem, se a Gestão voltar a persistir estado operacional local ou se deixar de carregar a sincronização server-authoritative.
- Nenhuma migration, RLS, grant, trigger, Edge Function ou dado do Supabase foi alterado nesta execução; por isso não houve alteração de banco nem necessidade de advisor de segurança.
- O projeto InfoTech.io não foi alterado.
