## 2026-09-01 00:29 — Venda idempotente do PDV endurece `search_path`
- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `assets/pdv-idempotency.js` e o estado atual das migrations antes da alteração.
- Confirmado o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) em estado `ACTIVE_HEALTHY`; o projeto InfoTech.io não foi alterado.
- Antes da DDL, o Security Advisor foi consultado e não apresentou aviso relacionado à PADOKA; permaneceram apenas avisos `rass_*` e a proteção global contra senhas vazadas.
- Revisada `padoka_private.padoka_create_sale_once(jsonb,text,uuid)`: a implementação já schema-qualificava tabelas PADOKA, helper de autorização e `auth.uid()`, mas ainda usava `search_path=public`.
- Aplicada a migration `078_pdv_sale_once_search_path_hardening.sql`, alterando somente o `search_path` da implementação privilegiada para `''`, sem mudar ACL, RLS, regras de estoque, idempotência ou papéis permitidos.
- Após a DDL foi confirmado que a função continua `SECURITY DEFINER`, `anon` continua sem `EXECUTE`, `authenticated` mantém somente o acesso necessário à RPC protegida e `search_path=''` está ativo.
- Adicionado `tests/pdv-sale-search-path-audit.mjs` para impedir regressão do `search_path`, retorno à RPC legada `padoka_create_sale` ou mutação direta de venda/estoque pelo navegador.
- O frontend continua finalizando exclusivamente por `padoka_create_sale_once`, com `request_id` persistido e proteção de lifecycle por funcionário.
- Security Advisor reexecutado depois da migration sem novo aviso PADOKA; objetos não-`padoka_` permaneceram intocados.
