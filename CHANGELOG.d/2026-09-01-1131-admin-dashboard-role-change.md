# 2026-09-01 11:31 — Dashboard interno limpa dados ao mudar papel do staff

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração; o backend correto permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e o projeto InfoTech.io não foi alterado.
- Identificado que `assets/internal-nav.js` já revalida periodicamente `padoka_staff_users` e atualiza `window.padokaStaffRole`, porém o dashboard administrativo podia manter em memória/DOM alertas operacionais montados para o papel anterior até o próximo ciclo de atualização.
- `assets/admin-dashboard-live.js` agora observa exclusivamente a mudança do atributo `data-staff-role` mantido pelo guard interno. Quando o papel muda ou é removido, o dashboard executa `clearDashboardState()` imediatamente antes de qualquer reativação.
- A limpeza invalida o `lifecycleEpoch`, remove pedidos recentes e indicadores, apaga o painel de alertas operacionais, encerra timers e remove canais Realtime de pedidos/estoque/produção pertencentes ao papel anterior.
- Se o papel for removido, o dashboard permanece fail-closed. Se um novo papel válido for aplicado para a mesma sessão, a remontagem usa um novo epoch e volta a consultar somente os módulos permitidos pela allowlist atual.
- Criado `tests/admin-dashboard-role-change-audit.mjs` para impedir regressão desse isolamento entre papéis e exigir limpeza de canais/dados antes da reativação.
- Nenhuma migration, RLS, policy, grant, trigger ou Edge Function foi alterada nesta execução; não houve ampliação de privilégios e nenhum objeto não-`padoka_` foi modificado.
