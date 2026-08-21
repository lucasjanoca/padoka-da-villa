## 2026-08-20 22:30 — Correção da permissão visual de estorno no PDV

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `pdv.html`, `assets/pdv-sale-void.js` e `tests/pdv-sale-void-audit.mjs` antes da alteração.
- Identificado um bug de integração entre scripts: `pdv.html` declara `staffRole` com `let`, portanto esse valor vive no binding global léxico e **não** em `globalThis.staffRole`.
- `assets/pdv-sale-void.js` estava consultando `globalThis.staffRole` em `canVoid()`, o que fazia `owner`/`manager` autenticados não passarem na verificação visual e impedia o módulo de histórico/estorno de montar, mesmo com a permissão correta no servidor.
- Corrigido `canVoid()` para ler o binding compartilhado `staffRole` com fallback seguro quando ainda não estiver inicializado.
- A segurança real continua no servidor: a RPC `padoka_void_sale` permanece restrita a `owner`/`manager`; esta correção apenas faz o frontend refletir corretamente a função já validada pelo PDV.
- `tests/pdv-sale-void-audit.mjs` agora exige o uso do binding `staffRole` e proíbe regressão para `globalThis.staffRole`.
- Tentativa de executar `node --check` e a auditoria específica por clone local foi bloqueada porque o ambiente não resolveu `github.com` por DNS. O GitHub também ainda não retornou status de CI para o commit do teste, então a execução remota não foi marcada como aprovada sem evidência.
- Nenhuma migration, RLS, query ou alteração de Supabase foi feita nesta execução; o projeto InfoTech.io permaneceu intocado e o backend correto da PADOKA continua sendo `Sites De Clientes!` (`yncspxfsvlqdnodlsosb`).
