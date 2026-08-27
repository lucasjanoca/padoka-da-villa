## 2026-08-27 18:30 — Configurações internas revalidam a conta ativa

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `assets/internal-nav.js`, `assets/settings-sync.js` e `tests/settings-sync-audit.mjs` antes da alteração.
- Identificado que `settings-sync.js` resolvia `owner/manager` apenas na inicialização. Após troca de conta na mesma aba, o guard global escondia a tela durante a revalidação, mas os controles de Configurações e o canal Realtime antigo podiam permanecer ativos quando a nova conta voltasse a ser exibida.
- O módulo agora observa `sb.auth.onAuthStateChange`, bloqueia imediatamente todos os controles sensíveis em mudança de identidade, remove o canal Realtime anterior e só reinicia depois que `internal-nav.js` resolver novamente o papel real da conta atual em `padoka_staff_users`.
- Se a nova conta não tiver papel `owner` ou `manager`, Configurações permanece fail-closed e nenhuma ação de salvamento é instalada para ela.
- `tests/settings-sync-audit.mjs` passou a exigir lifecycle de autenticação, remoção do canal anterior e bloqueio explícito após downgrade de papel.
- Nenhum HTML/CSS, banco, RLS, grant, Edge Function, preço, catálogo público ou objeto não-`padoka_` foi alterado; o visual normal para `owner/manager` permanece igual.
