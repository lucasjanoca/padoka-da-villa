# 2026-08-27 15:30 — Fila interna oculta durante revalidação de staff

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `pedidos.html`, `assets/internal-nav.js` e `tests/staff-navigation-audit.mjs` antes da alteração.
- Confirmado o estado atual da `main` no commit `b255d7fe351da7b05ee070d3ac74d1a6a4227183`; nenhuma alteração foi feita no projeto InfoTech.io nem em objetos não-`padoka_`.
- Identificado que o guard global de sessão escondia apenas `#app`. `pedidos.html` usa um `<main>` direto no `body`, então pedidos já renderizados podiam continuar visíveis durante logout/troca de conta até a navegação/reload, embora o backend permanecesse protegido por Auth/RLS.
- `assets/internal-nav.js` agora também esconde `body > main` enquanto `padoka-staff-pending` ou `padoka-role-pending` estiver ativo. Isso cobre a fila de pedidos sem alterar layout, permissões, dados ou comportamento após a validação bem-sucedida.
- O fluxo existente de `onAuthStateChange`, invalidação por `staffValidationEpoch`, limpeza de `padokaStaffRole`/`padokaCanAccess` e nova validação em `padoka_staff_users` foi preservado.
- `tests/staff-navigation-audit.mjs` passou a exigir que o guard cubra tanto wrappers `#app` quanto páginas internas com conteúdo principal em `body > main`, prevenindo regressão.
- Nenhuma migration, RLS, grant ou Edge Function foi alterada nesta execução; portanto nenhuma mudança de banco foi necessária.
