## 2026-08-28 04:26 — Auditoria operacional alinhada ao lifecycle de autenticação

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` no estado atual da `main` antes da alteração.
- Confirmado que o HEAD anterior era `4967b83711c2574f929b203cda519f86c3365057`; o GitHub Pages havia publicado com sucesso, porém o `PADOKA Static Audit #379` falhou em `tests/operational-fail-closed-audit.mjs`.
- A falha vinha de uma asserção obsoleta que ainda exigia o marcador legado `#app.hidden`, removido quando `assets/operational-sync.js` passou a revalidar logout/troca de funcionário por lifecycle de Auth.
- A auditoria agora exige explicitamente `waitForStaffGuard`, os guards `padoka-staff-pending`/`padoka-role-pending`, `sessionStillMatches`, `lifecycleEpoch`, `onAuthStateChange` e limpeza/revalidação do estado operacional.
- A mudança não relaxa o teste: substitui a checagem antiga pela proteção atual, mais forte, que confirma identidade e guard interno antes de carregar estoque, produção e perdas.
- Nenhum HTML/CSS, migration, RLS, grant, RPC, Edge Function, secret ou configuração Supabase foi alterado.
- Nenhum objeto fora de `padoka_` e nenhum projeto InfoTech.io foi tocado.
