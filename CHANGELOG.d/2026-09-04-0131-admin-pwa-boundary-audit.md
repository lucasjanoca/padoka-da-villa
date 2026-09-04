# 2026-09-04 01:31 — Fronteira do PWA administrativo protegida por auditoria

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` no HEAD atual antes da alteração.
- Confirmado que o backend correto permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o projeto InfoTech.io não foi alterado.
- Revisados os novos `admin-manifest.webmanifest` e `admin-install.html`: o app administrativo inicia em `internal.html`, mantém CSP restritiva, `noindex` e não carrega Supabase/Auth diretamente; a autenticação e as permissões continuam responsabilidade das telas internas protegidas.
- Criado `tests/admin-pwa-boundary-audit.mjs` para impedir regressões que façam páginas públicas anunciarem o instalador/manifesto administrativo, introduzam segredos no PWA ADM ou permitam que o service worker público pré-cacheie telas privadas.
- A auditoria exige que `internal.html`, `pedidos.html`, `pdv.html`, `gestao.html`, `mfa.html`, `enterprise.html` e `club-admin.html` permaneçam classificadas como privadas e fora de `APP_SHELL`/`PUBLIC_CACHE_PATHS`.
- O workflow `PADOKA Static Audit` executa automaticamente todo `tests/*.mjs`, portanto a nova proteção passa a fazer parte do CI sem alterar o runtime do site.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function, OAuth Google, credencial, dado comercial ou objeto não-`padoka_` foi alterado nesta execução.
