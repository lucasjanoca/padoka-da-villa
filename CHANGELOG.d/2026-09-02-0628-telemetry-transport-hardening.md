# Telemetria pública — transporte endurecido

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração.
- Confirmado que a PADOKA continua usando exclusivamente o projeto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o projeto InfoTech.io não foi alterado.
- `assets/telemetry.js` agora deriva o endpoint exclusivamente do origin fixado `https://yncspxfsvlqdnodlsosb.supabase.co`, reduzindo risco de regressão para outro backend.
- O envio de telemetria passou a rejeitar redirects (`redirect: 'error'`) e não enviar referrer (`referrerPolicy: 'no-referrer'`), mantendo `credentials: 'omit'` e `cache: 'no-store'`.
- A API pública `window.PADOKA_TELEMETRY` passou a ser imutável com `Object.freeze` após a inicialização.
- A telemetria continua desativada nas páginas internas (`internal.html`, `pedidos.html`, `pdv.html`, `gestao.html`, `enterprise.html` e `mfa.html`) e continua sanitizando metadados antes do envio.
- Criado `tests/telemetry-transport-audit.mjs` para impedir regressão do project pinning, opções de transporte e ausência de credenciais privilegiadas no frontend.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function ou configuração Google foi alterada nesta execução; portanto não houve mudança de banco que exigisse Security Advisors.