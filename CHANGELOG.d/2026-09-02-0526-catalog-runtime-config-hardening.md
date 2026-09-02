## 2026-09-02 05:26 — Catálogo público passa a depender somente do runtime endurecido
- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `assets/catalog.js`, `assets/account.js`, `index.html` e `tests/static-audit.mjs` antes da alteração.
- Confirmado que o backend correto permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o projeto InfoTech.io não foi alterado.
- Identificado que `assets/catalog.js` ainda mantinha fallback próprio para buscar `padoka-public-config` quando `PADOKA_RUNTIME` não estivesse disponível e aceitava qualquer `publishableKey` não vazia.
- Removido o fallback próprio: o catálogo agora exige `PADOKA_RUNTIME.getPublicConfig()` e falha fechado quando o runtime central não está disponível.
- Adicionada defesa em profundidade no próprio catálogo: `scope` precisa ser `padoka`, a URL precisa ser exatamente a raiz HTTPS `https://yncspxfsvlqdnodlsosb.supabase.co`, chaves modernas precisam usar `sb_publishable_...` e JWT público legado só é aceito quando o payload declara `role=anon`.
- A consulta a `padoka_products` permanece server-authoritative, filtrando somente `active=eq.true`; a requisição agora também usa `credentials: omit`, `redirect: error`, `cache: no-store` e exige resposta `application/json` antes do parse.
- Preservados nomes/preços vindos do servidor, identificação de dados demonstrativos, sanitização de `product_id`/textos e imagens distintas de expresso, cappuccino, suco e água.
- Criado `tests/catalog-runtime-config-audit.mjs` para impedir regressões no project pinning, runtime central, tipo de chave pública, transporte do catálogo e imagens das bebidas.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function ou configuração Google foi alterada nesta execução; não houve mudança de banco que exigisse consulta aos Security Advisors.
