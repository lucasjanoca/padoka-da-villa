## 2026-09-03 15:27 — Fronteira público/interno protegida pelo CI

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` e confirmado que a PADOKA continua usando exclusivamente o projeto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`), sem alteração no InfoTech.io.
- `tests/static-audit.mjs` passou a considerar também `enterprise.html` e `club-admin.html` como superfícies internas proibidas na navegação pública, além de `internal.html`, `pedidos.html`, `pdv.html` e `gestao.html`.
- A auditoria agora verifica `href`, `action` e `formaction`, reduzindo a chance de um módulo interno reaparecer por link ou formulário em qualquer página pública do cliente.
- As páginas públicas também passam a falhar no CI se carregarem diretamente controladores internos como `internal-nav.js`, `operational-sync.js`, `reporting-sync.js`, `settings-sync.js`, `loss-registration.js`, `pdv-idempotency.js` ou `club-admin.js`.
- Nenhum HTML/CSS, runtime funcional, migration, RLS, policy, grant, trigger, Edge Function, configuração Google OAuth ou objeto não-`padoka_` foi alterado nesta rodada.
- A validação local não pôde ser executada porque o ambiente de shell não resolveu `github.com`; o `PADOKA Static Audit` do GitHub Actions passou no commit da alteração, servindo como validação do teste no repositório real.