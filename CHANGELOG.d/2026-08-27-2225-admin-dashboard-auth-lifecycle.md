# 2026-08-27 22:25 — Dashboard interno revalida a sessão antes de manter dados vivos

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `assets/internal-nav.js`, `assets/admin-dashboard-live.js`, `internal.html` e `tests/admin-dashboard-audit.mjs` antes da alteração.
- O dashboard administrativo agora acompanha `onAuthStateChange` e limpa imediatamente métricas, pedidos recentes, alertas operacionais, timers e canais Realtime quando ocorre logout ou troca de identidade na mesma aba.
- A reativação só acontece depois que o guard global remove `padoka-staff-pending`, `window.padokaStaffRole` está novamente resolvido e a sessão atual confirma o mesmo `user_id` esperado.
- Consultas de pedidos, estoque e produção passam a carregar um `lifecycleEpoch` e o `activeUserId`; respostas assíncronas da sessão anterior são descartadas antes de renderizar qualquer dado.
- Canais `padoka-admin-dashboard-live`, `padoka-admin-inventory-live` e `padoka-admin-production-live` são removidos na invalidação da sessão, e os intervalos periódicos também são encerrados para evitar atualização pela identidade anterior.
- As allowlists operacionais permanecem inalteradas: estoque somente para `owner/manager/stock` e produção somente para `owner/manager/production`.
- `tests/admin-dashboard-audit.mjs` agora exige lifecycle de Auth, espera pelo guard interno, limpeza de UI, remoção de Realtime, encerramento de timers e invalidação de respostas assíncronas antigas.
- Nenhum HTML/CSS, migration, RLS, grant ou Edge Function foi alterado; o visual da PADOKA permanece igual e nenhum objeto fora do prefixo `padoka_` foi tocado.
- O backend permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); o projeto InfoTech.io não foi alterado.
