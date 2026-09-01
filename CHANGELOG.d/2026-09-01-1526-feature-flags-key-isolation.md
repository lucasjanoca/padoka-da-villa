# 2026-09-01 15:26 — Isolamento das chaves de feature flags públicas

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração; o backend correto permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e o projeto InfoTech.io não foi alterado.
- `assets/feature-flags.js` continua buscando somente `padoka_feature_flags` com `audience=eq.public`, usando chave publicável, `credentials: 'omit'`, `cache: 'no-store'`, `redirect: 'error'` e validação rígida da origem Supabase da PADOKA.
- Os mapas de flags/configuração agora são criados com `Object.create(null)`, removendo herança de `Object.prototype` para que nomes recebidos do backend não possam colidir com propriedades especiais do JavaScript.
- Chaves passam por allowlist de formato antes de entrar no runtime; `__proto__`, `prototype` e `constructor` são rejeitadas explicitamente e qualquer linha inválida é ignorada em modo fail-closed.
- `PADOKA_FEATURES.enabled()` e `PADOKA_FEATURES.config()` também validam a chave solicitada antes de consultar os mapas.
- A auditoria `tests/feature-flags-public-fetch-audit.mjs` foi ampliada para impedir regressão para mapas com protótipo ou aceitação de chaves perigosas, preservando as verificações de backend, isolamento de credenciais e ausência de `service_role`/`sb_secret_` no frontend.
- Nenhuma migration, RLS, policy, grant, trigger ou Edge Function foi alterada; portanto nenhum privilégio foi ampliado e não houve mudança de banco que exigisse advisor nesta execução.
