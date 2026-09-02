## 2026-09-02 16:29 — AUTH_STATUS alinhado ao checkout v3

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` no HEAD atual antes da alteração.
- Confirmado que o backend correto continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o projeto InfoTech.io permanece fora do escopo da PADOKA.
- Identificada inconsistência documental: `assets/order-idempotency.js` usa exclusivamente a RPC server-authoritative e idempotente `padoka_create_order_once_v3`, enquanto `AUTH_STATUS.md` ainda citava a geração anterior `padoka_create_order_once` como atual.
- `AUTH_STATUS.md` foi atualizado para documentar `padoka_create_order_once_v3`, incluindo o envio explícito da forma de pagamento e deixando `padoka_create_order`, `padoka_create_order_once` e `padoka_create_order_once_v2` registrados como caminhos legados fora do runtime.
- Criada `tests/auth-status-consistency-audit.mjs` para impedir divergência futura entre o estado documentado e o runtime do checkout, além de preservar project ref, isolamento do InfoTech.io, ausência de trigger global em `auth.users`, requisitos de onboarding e `prompt=select_account` do Google.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function ou configuração Google foi alterada nesta execução.
