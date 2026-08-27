## 2026-08-27 11:30 — Área interna oculta durante revalidação de staff
- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `assets/internal-nav.js` e `tests/staff-navigation-audit.mjs` antes da alteração.
- Confirmado que o backend correto continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`), em estado `ACTIVE_HEALTHY`; o projeto InfoTech.io não foi alterado.
- Identificado que logout/troca de conta já invalidava o papel anterior e redirecionava/revalidava a sessão, porém páginas internas cujo módulo base é permitido a qualquer staff ativo podiam permanecer visualmente expostas por um breve intervalo durante a revalidação.
- `assets/internal-nav.js` agora aplica um guard global `padoka-staff-pending` desde a validação inicial e sempre que a sessão é invalidada; `#app` fica invisível até que a mesma conta seja novamente confirmada como staff ativo em `padoka_staff_users`.
- O guard por função `padoka-role-pending` foi preservado para módulos com papéis específicos; nenhum papel, grant, RLS, RPC ou objeto de banco foi alterado.
- `tests/staff-navigation-audit.mjs` passou a exigir o comportamento fail-closed global e só aceitar a remoção do guard após revalidação bem-sucedida.
- Nenhum HTML/CSS de layout foi alterado; a mudança só afeta o intervalo de validação de autenticação/permissão e não muda o visual normal da área interna.
- O changelog atual do Supabase foi revisado; não há breaking change recente de Auth/Realtime que exija ajuste deste fluxo no navegador. A mudança de `realtime-js` para Node <22 não afeta browsers.
