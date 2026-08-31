## 2026-08-31 17:26 — Catálogo público fixa o backend PADOKA

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` e confirmado o backend exclusivo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`).
- `assets/catalog.js` agora fixa `PADOKA_ORIGIN` no project ref da PADOKA e valida a `url` devolvida por `padoka-public-config` antes de consultar `padoka_products`.
- Uma resposta de configuração apontando para outro host/projeto passa a falhar fechada, mantendo o catálogo indisponível em vez de seguir silenciosamente para um backend incorreto.
- A `publishableKey` também precisa existir e ser uma string não vazia antes da consulta ao catálogo.
- Adicionado `tests/catalog-backend-pinning-audit.mjs` para impedir regressão ao uso direto de `cfg.url` e impedir referência ao InfoTech.io no runtime do catálogo.
- A mudança é somente de frontend/isolamento: nenhuma migration, RLS, policy, grant, trigger, Edge Function ou objeto não-`padoka_` foi alterado.
- O catálogo continua server-authoritative e mantém os dados provisórios claramente sinalizados; imagens distintas de expresso, cappuccino, suco e água foram preservadas.