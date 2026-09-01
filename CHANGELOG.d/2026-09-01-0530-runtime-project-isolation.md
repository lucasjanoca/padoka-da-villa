# 2026-09-01 05:30 — Runtime não reage a token de outro projeto Supabase

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração.
- Confirmado que o backend correto continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o projeto InfoTech.io não foi alterado.
- Identificado que `assets/app-runtime.js` usava uma expressão genérica `sb-*-auth-token` apenas como indício visual de sessão persistida na tela da conta. Isso não concedia acesso, porém poderia fazer o boot da PADOKA reagir à presença de um token de outro projeto Supabase armazenado no mesmo origin.
- O runtime agora declara explicitamente `PADOKA_PROJECT_REF` e deriva `PADOKA_ORIGIN` e `PADOKA_AUTH_STORAGE_KEY` desse identificador.
- `hasPersistedSessionHint()` consulta somente `sb-yncspxfsvlqdnodlsosb-auth-token`; nenhum token de outro projeto é considerado para a experiência de boot da conta.
- A validação da configuração pública continua presa à origem `https://yncspxfsvlqdnodlsosb.supabase.co` e a função `padoka-public-config` continua sendo a única origem aceita para a configuração pública.
- Criado `tests/runtime-project-isolation-audit.mjs` para impedir regressão para matcher genérico de tokens Supabase e preservar o pinning do backend PADOKA.
- Nenhuma migration, RLS, policy, grant, Edge Function ou credencial foi alterada nesta execução.
