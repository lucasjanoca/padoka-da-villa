## 2026-08-31 18:29 — Implementações críticas passam a usar search_path vazio

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` no HEAD atual e confirmado o backend exclusivo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); InfoTech.io permaneceu intocado.
- Antes da DDL, confirmadas RLS ativa e ausência de `INSERT`/`UPDATE`/`DELETE` direto para `anon`/`authenticated` nas tabelas públicas `padoka_*`.
- Revisadas as definições de `padoka_private.padoka_list_product_barcodes`, `padoka_private.padoka_save_profile` e `padoka_private.padoka_update_order_status`: as relações e helpers usados já estavam qualificados por schema, permitindo endurecimento sem alterar a lógica.
- Aplicada a migration `075_security_definer_search_path_hardening.sql`, mudando somente o `search_path` dessas três implementações `SECURITY DEFINER` de `public` para `''`, reduzindo risco de resolução indevida de objetos.
- Nenhum grant foi ampliado ou removido; os wrappers públicos, autenticação, autorização, onboarding, PDV e transição de pedidos mantêm o mesmo contrato.
- A verificação pós-migration confirmou `SECURITY DEFINER` preservado, `search_path=''`, `anon` sem execução e ACL de `authenticated` inalterada para as três implementações.
- Adicionado `tests/security-definer-search-path-audit.mjs` para impedir regressão dessas três configurações.
- Security Advisor executado antes e depois da mudança sem novos alertas PADOKA; permaneceram somente avisos existentes de objetos `rass_*` e da configuração global de proteção contra senhas vazadas, sem alteração.
