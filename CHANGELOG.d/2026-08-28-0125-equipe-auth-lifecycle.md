# 2026-08-28 01:25 — Equipe falha fechado em troca de identidade

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `assets/internal-nav.js`, `assets/staff-management.js`, `assets/staff-audit.js` e as auditorias de equipe antes da alteração.
- Preservado o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); nenhuma migration, RLS, grant ou objeto fora do prefixo `padoka_` foi alterado.
- Identificado que a gestão de funcionários era validada como `owner` na inicialização, mas a lista de equipe e o histórico podiam permanecer montados visualmente se a identidade Auth mudasse na mesma aba.
- `assets/staff-audit.js`, carregado junto da Gestão, agora observa `onAuthStateChange` e, em logout/troca de identidade, remove imediatamente painel, aba e link da Equipe e retorna para `internal.html`, onde o guard global revalida o staff atual.
- Consultas de `padoka_list_staff_audit` agora ficam vinculadas a `activeUserId` + `lifecycleEpoch`; respostas da sessão anterior são descartadas e não podem ser renderizadas após mudança de identidade.
- A revalidação também exige que `window.padokaStaffRole` continue sendo `owner` e que `padoka-staff-pending` já tenha sido removido pelo guard global.
- O callback de `onAuthStateChange` permanece síncrono; a navegação é adiada com `setTimeout`, evitando trabalho assíncrono direto dentro do callback de Auth.
- `tests/staff-audit-trail-audit.mjs` foi ampliado para exigir limpeza da interface, redirecionamento fail-closed, vínculo das respostas ao lifecycle e dependência do guard de staff.
- Nenhuma conta Auth é criada automaticamente, nenhum trigger global em `auth.users` foi adicionado e `padoka_profiles` continua separado de `padoka_staff_users`.
- Nenhum HTML/CSS visual foi alterado; a experiência normal de owner permanece igual.
