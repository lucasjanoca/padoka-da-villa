# 2026-08-30 09:26 — Gestão de catálogo falha fechada em erros de Auth

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração e confirmado o backend exclusivo da PADOKA em **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); o projeto InfoTech.io não foi alterado.
- Identificado que `assets/product-management.js` ainda usava `auth.getSession()` em dois pontos sem tratar o campo `error` retornado pelo Supabase Auth.
- Criado `safeSession()` para centralizar a leitura de sessão, rejeitando tanto erros retornados pelo Auth quanto falhas de transporte e retornando `null` em caso de identidade não confirmada.
- `sessionStillMatches()` e o bootstrap da gestão de catálogo agora usam exclusivamente essa leitura segura; sem sessão confirmada, listagem/gravação não prosseguem e o módulo permanece fail-closed.
- Mantidos os guards por `lifecycleEpoch` e `activeUserId`, a remoção imediata dos controles na troca de conta, o Realtime associado à identidade validada e a restrição visual a `owner`/`manager`.
- `tests/product-management-audit.mjs` agora exige tratamento explícito de `{data,error}`, captura de falha de transporte, centralização de `getSession()` e bootstrap fail-closed.
- O catálogo continua sendo alterado somente por `padoka_save_product`; não foi adicionada escrita direta em `padoka_products` no navegador.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada nesta execução; portanto nenhum privilégio foi ampliado e não houve mudança de banco que exigisse nova consulta aos Security Advisors.
