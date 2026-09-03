# 2026-09-03 16:31 — Auditoria de isolamento dos pedidos do cliente

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `acompanhamento.html` e o workflow `PADOKA Static Audit` antes da alteração.
- Confirmado que o backend documentado da PADOKA continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o projeto InfoTech.io permanece fora do escopo.
- Confirmado que `acompanhamento.html` já carrega `padoka_orders` somente com `customer_id` igual ao usuário autenticado, ordena por `created_at` decrescente e limita o canal Realtime ao mesmo `customer_id`.
- Criado `tests/customer-orders-isolation-audit.mjs` para impedir regressões nessas garantias sem alterar o runtime.
- A nova auditoria também preserva a experiência `Seus pedidos`: sem campo de pesquisa, progresso `Recebido → Visto → Confirmado → Preparo → Pronto → Retirado`, destaque `Pode vir buscar!`, detalhes expansíveis e atualização Realtime.
- O teste exige que troca/logout de conta limpe imediatamente pedidos, itens e eventos em memória, entre em estado visual fail-closed e descarte respostas assíncronas ligadas à identidade anterior por `activeCustomerId + sessionGeneration`.
- Também bloqueia a introdução de `service_role`, `sb_secret_` ou referência a `auth.users` no acompanhamento público.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function, configuração Google OAuth, credencial, dado comercial ou objeto não-`padoka_` foi alterado nesta rodada.
- Como não houve mudança de banco/RLS, não foi necessário executar Security Advisors nesta rodada.
