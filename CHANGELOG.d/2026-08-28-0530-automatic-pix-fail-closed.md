# 2026-08-28 05:30 — Checkout público passa a exigir Pix automático

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` no estado atual do repositório antes da alteração.
- Preservado o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e o isolamento por objetos `padoka_*`; nenhum objeto ou projeto InfoTech.io foi alterado.
- Identificado que `pagamento.html` ainda renderizava Pix manual/estático, apesar de a direção atual exigir confirmação automática sem depender de comprovante ou conferência humana.
- `assets/order-idempotency.js` passou a aplicar um gate fail-closed antes de qualquer criação de pedido: enquanto o adapter de Pix automático e webhook autenticado não estiverem realmente integrados, o botão de envio permanece desabilitado.
- Após a inicialização da página, a área de pagamento é substituída por uma mensagem amigável de que o Pix automático está em configuração, removendo o caminho operacional de confirmação manual para novos pedidos públicos.
- O guard também existe dentro de `sendOnce()`, antes da RPC `padoka_create_order_once`, evitando bypass por chamada do handler enquanto o Pix automático estiver indisponível.
- A camada idempotente e server-authoritative foi preservada para ser reutilizada quando a integração automática for concluída com provedor real.
- `tests/order-idempotency-audit.mjs` passou a exigir explicitamente o bloqueio automático, a mensagem ao cliente e a rejeição de comprovante/confirmação manual como autorização.
- `PIX_SETUP_CHECKLIST.md` foi alinhado ao modo automático-only: secrets financeiros somente no backend, webhook autenticado, validação de valor/identidade da cobrança e liberação do checkout somente após integração e auditoria reais.
- Nenhuma migration, RLS, grant, Edge Function implantada ou secret foi alterado nesta rodada; não foi necessário ampliar acesso nem consultar advisors por mudança de banco.
