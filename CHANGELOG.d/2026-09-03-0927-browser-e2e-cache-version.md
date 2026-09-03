## 2026-09-03 09:27 — Browser E2E acompanha a versão real do Service Worker

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md` e o estado atual do repositório antes da alteração.
- Confirmado que o backend correto continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o projeto InfoTech.io não foi alterado.
- O `PADOKA Static Audit` do HEAD anterior estava verde, mas o `PADOKA Browser E2E` agendado falhou porque `tests/e2e-browser-smoke.mjs` ainda esperava literalmente o cache `padoka-pwa-v6`, enquanto o `service-worker.js` atual usa `padoka-pwa-v8`.
- A falha era do teste de convergência, não uma regressão de runtime: o Service Worker atual mantém o cache versionado e o backend PADOKA fixo.
- `tests/e2e-browser-smoke.mjs` agora lê o `CACHE_NAME` diretamente do `service-worker.js` do commit testado, valida que ele segue o formato `padoka-pwa-vN` e só considera produção convergida quando o arquivo publicado contém exatamente a mesma versão.
- Isso preserva a função original do E2E — confirmar que o GitHub Pages publicou o mesmo Service Worker do repositório — sem exigir atualização manual do número da versão a cada incremento seguro de cache.
- Nenhum HTML/CSS, runtime de produção, migration, RLS, policy, grant, trigger, Edge Function, credencial Google OAuth ou objeto não-`padoka_` foi alterado nesta execução.
