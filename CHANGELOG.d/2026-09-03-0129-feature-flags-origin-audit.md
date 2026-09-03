# 2026-09-03 01:29 — Auditoria de origem das feature flags alinhada ao runtime

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração, preservando o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e mantendo o projeto InfoTech.io fora do escopo.
- O `PADOKA Static Audit #1299` concluiu com falha em `tests/feature-flags-public-fetch-audit.mjs`, embora o runtime `assets/feature-flags.js` já validasse a configuração pública antes de qualquer acesso REST.
- Confirmado que `assets/feature-flags.js` fixa `PADOKA_ORIGIN` em `https://yncspxfsvlqdnodlsosb.supabase.co`, valida `scope = 'padoka'`, exige a origem exata e o caminho raiz `/`, valida a chave pública e só então monta `/rest/v1/padoka_feature_flags`.
- A auditoria estava procurando o helper legado `requirePadokaOrigin(cfg.url)`, já substituído pelo fluxo `validateConfig(await window.PADOKA_RUNTIME.getPublicConfig())`.
- `tests/feature-flags-public-fetch-audit.mjs` foi atualizado para auditar a arquitetura atual: validação da config antes do REST, origem exata da PADOKA, caminho raiz, retorno da origem fixada e uso exclusivo de `cfg.origin` já validado.
- Foram preservadas as verificações de `credentials: 'omit'`, `redirect: 'error'`, `cache: 'no-store'`, `audience=eq.public`, mapas com protótipo nulo, rejeição de chaves perigosas e ausência de `service_role`/`sb_secret_`.
- Nenhum runtime de produção, HTML/CSS, migration, RLS, policy, grant, trigger, Edge Function ou configuração Google OAuth foi alterado nesta execução.
