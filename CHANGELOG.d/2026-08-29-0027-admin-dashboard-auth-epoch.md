# 2026-08-29 00:27 — Dashboard administrativo vincula ativação ao epoch de autenticação

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração, preservando o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e sem tocar no projeto InfoTech.io.
- Identificado que `assets/admin-dashboard-live.js` já limpava métricas, timers e canais Realtime na troca de sessão e já invalidava respostas de consultas pelo `lifecycleEpoch`, porém a espera inicial em `waitForValidatedStaff` ainda podia continuar viva depois de uma nova troca de identidade.
- `waitForValidatedStaff` agora recebe o `expectedEpoch` da transição e aborta imediatamente se o lifecycle mudar, inclusive depois do `getSession()` assíncrono.
- `init` também recebe o mesmo epoch e não pode mais ativar uma inicialização antiga depois que outra identidade assumiu a sessão.
- Cada evento relevante de `onAuthStateChange` captura o epoch criado por `clearDashboardState()` e o encaminha explicitamente à ativação da identidade seguinte.
- `tests/admin-dashboard-audit.mjs` foi ampliado para exigir o vínculo entre espera de staff, inicialização e epoch, impedindo regressão para uma ativação assíncrona sem geração de sessão.
- Nenhum HTML/CSS foi alterado; a experiência mobile-first e o visual do painel permanecem intactos.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada nesta execução; portanto não houve mudança de banco que exigisse Security Advisors.
