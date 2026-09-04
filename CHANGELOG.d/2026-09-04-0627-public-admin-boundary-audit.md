## 2026-09-04 06:27 — CI protege fronteira entre área pública e módulos internos

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração.
- Confirmado que o backend correto continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o projeto InfoTech.io não foi alterado.
- `tests/admin-pwa-boundary-audit.mjs` passou a bloquear links/form actions diretos das páginas públicas para `internal.html`, `pedidos.html`, `pdv.html`, `gestao.html`, `mfa.html`, `enterprise.html` e `club-admin.html`.
- A mesma auditoria agora impede que páginas públicas carreguem runtimes administrativos conhecidos, incluindo navegação interna, dashboard, sincronização operacional, perdas, PDV idempotente, gestão de equipe, relatórios e configurações.
- As verificações anteriores do PWA administrativo foram preservadas: instalador e manifesto ADM não podem ser anunciados pelo site público, páginas privadas não podem entrar no cache público e segredos administrativos continuam proibidos.
- Nenhum HTML/CSS, runtime de negócio, migration, RLS, policy, grant, trigger, Edge Function, OAuth Google, credencial ou objeto do banco foi alterado nesta execução.
- Como não houve mudança no banco/RLS, não foi necessário consultar Security Advisors nesta rodada.
