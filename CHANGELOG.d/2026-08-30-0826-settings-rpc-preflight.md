# 2026-08-30 08:26 — Configurações internas confirmam sessão antes das RPCs

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `assets/settings-sync.js` e `tests/settings-sync-audit.mjs` antes da alteração.
- Confirmado que o backend documentado da PADOKA continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o projeto InfoTech.io não faz parte da PADOKA.
- Identificado que `padoka_get_settings` e `padoka_update_settings` ainda podiam ser chamados antes de uma reconfirmação imediata da sessão do funcionário, embora as respostas já fossem revalidadas depois.
- `assets/settings-sync.js` agora exige `identityStillCurrent(epoch,userId)` antes de ambas as RPCs, além da validação posterior já existente.
- Falha de confirmação da sessão entra em modo fail-closed, bloqueia os controles e agenda uma nova ativação completa do mesmo `user_id`; se houve logout/troca de conta, o lifecycle novo impede que a identidade antiga seja reativada.
- O retry nunca reaproveita papel/estado antigo sem passar novamente por `safeSession`, espera do staff guard e validação de `owner`/`manager`.
- `tests/settings-sync-audit.mjs` agora verifica por posição de código que o preflight ocorre antes de `padoka_get_settings` e `padoka_update_settings`, além de exigir o caminho fail-closed de reativação.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada nesta execução; nenhum privilégio foi ampliado e não houve necessidade de consulta aos Security Advisors.
- Nenhum módulo público ou HTML/CSS foi alterado; o isolamento de cliente/staff, a experiência mobile-first e os dados demonstrativos permanecem preservados.
