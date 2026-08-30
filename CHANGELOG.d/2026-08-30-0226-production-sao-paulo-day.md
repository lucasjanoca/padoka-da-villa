# Produção usa o dia operacional de São Paulo

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração; confirmado que a PADOKA permanece no projeto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o InfoTech.io não deve ser alterado.
- `assets/production-completion.js` deixou de calcular `plan_date` pelo fuso local do navegador e agora determina a data explicitamente em `America/Sao_Paulo`.
- Isso evita carregar ou registrar contra o plano do dia incorreto quando o dispositivo estiver configurado em outro fuso, especialmente perto da virada da data.
- O fluxo idempotente de produção, `request_id` por funcionário, confirmação de sessão, lifecycle de autenticação, Realtime e RPC `padoka_record_production` foram preservados.
- `tests/production-frontend-audit.mjs` passou a exigir o fuso `America/Sao_Paulo` e a impedir regressão para `toLocaleDateString('en-CA')` sem `timeZone` explícito.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada nesta execução; portanto não houve ampliação de privilégios nem mudança de banco que exigisse Security Advisors.
