# 2026-08-29 19:27 — PDV preserva retry e falha fechado sem confirmação de sessão

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração e confirmado que o backend correto continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); o projeto InfoTech.io não foi alterado.
- Identificado em `assets/pdv-idempotency.js` que a RPC idempotente `padoka_create_sale_once` já preservava `request_id`, porém leituras de `auth.getSession()` após a RPC, durante o guard de staff e na ativação do módulo ainda podiam rejeitar por falha de transporte sem tratamento local.
- Adicionado `safeSession()` para capturar tanto erros retornados pelo Supabase Auth quanto rejeições reais de rede. Sem sessão confirmada, o Caixa permanece bloqueado em modo fail-closed.
- Se a sessão não puder ser confirmada depois de uma tentativa de venda, a tentativa permanece em `sessionStorage` vinculada ao mesmo funcionário e com o mesmo `request_id`; o frontend não declara sucesso nem gera uma segunda identidade de venda.
- O probe de `padoka_sales` agora também captura falha de transporte e a reativação disparada por mudança de autenticação captura rejeições assíncronas em vez de deixá-las sem tratamento.
- `tests/pdv-idempotency-audit.mjs` foi ampliado para exigir o helper seguro de sessão, preservação do retry em falha de confirmação, probe protegido e captura da reativação assíncrona.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada nesta execução; não houve ampliação de acesso nem mudança em objetos não-`padoka_`.
