# 2026-08-30 19:29 — Notificações do cliente isoladas por lifecycle

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração; o backend correto permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e o projeto InfoTech.io não foi alterado.
- Identificada uma janela no frontend da central de notificações: `assets/customer-notifications.js` mantinha a sessão em uma variável mutável, mas uma consulta assíncrona iniciada pela conta anterior ainda podia terminar depois de uma troca de autenticação e tentar renderizar estado antigo no navegador.
- A central agora usa `lifecycleEpoch` + `activeUserId`, limpa imediatamente lista/badge/painel ao trocar de identidade e invalida respostas assíncronas iniciadas por sessões anteriores.
- Leituras de `padoka_customer_notifications` reconfirmam a sessão real antes da consulta e novamente antes de aceitar/renderizar a resposta.
- Marcações individual e em lote também capturam a identidade atual e reconfirmam a sessão antes e depois da escrita; o filtro explícito por `user_id` foi preservado, além da RLS existente no backend.
- O canal Realtime continua filtrado por `user_id`, é removido na troca de conta e callbacks antigos são ignorados quando o lifecycle não corresponde mais à identidade ativa.
- Criado `tests/customer-notifications-lifecycle-audit.mjs`, que também faz parse do runtime com `new Function` para impedir regressões de sintaxe e exige os guards de sessão/lifecycle.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada nesta execução; nenhum privilégio foi ampliado e nenhum objeto não-`padoka_` foi tocado.
