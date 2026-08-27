# 2026-08-27 08:26 — Checkout remove finalizador legado

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `pagamento.html`, `assets/order-idempotency.js`, `tests/order-idempotency-audit.mjs` e o estado atual do backend antes da alteração.
- Confirmado no projeto correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) que o backend está `ACTIVE_HEALTHY`; o projeto InfoTech.io não foi alterado.
- Confirmado que `padoka_create_order_once(uuid,text,date,time,text,jsonb)` permanece `SECURITY DEFINER`, com `search_path=public`, valida `auth.uid()`, exige onboarding PADOKA concluído, recalcula preços pelo catálogo ativo e é executável por `authenticated`, mas não por `anon`.
- Confirmado que a RPC legada `padoka_create_order(text,date,time,text,jsonb)` já está sem `EXECUTE` para `anon` e `authenticated`.
- Removido de `pagamento.html` o finalizador inline que ainda chamava `padoka_create_order`, eliminando o último caminho de navegador sem `request_id`.
- O checkout agora depende exclusivamente de `assets/order-idempotency.js` para envio: ele usa `padoka_create_order_once`, preserva o mesmo `request_id` em respostas de rede ambíguas e só limpa carrinho/retirada após confirmação.
- Se o módulo idempotente não carregar, o HTML não possui mais um fallback capaz de criar pedido pela RPC antiga; o envio falha fechado em vez de regredir para um caminho não idempotente.
- `tests/order-idempotency-audit.mjs` passou a impedir regressão tanto da RPC legada quanto do handler inline antigo no checkout.
- Nenhum HTML/CSS visual foi alterado; layout, textos e experiência mobile-first foram preservados.
- Nenhuma migration, RLS ou grant foi alterado nesta execução.
