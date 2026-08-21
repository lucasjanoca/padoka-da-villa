# 2026-08-21 07:29 — Checkout com renderização endurecida

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `conta.html` e `pagamento.html` antes da alteração.
- Identificado que `pagamento.html` ainda inseria nome de retirada, nome dos produtos e dados do perfil diretamente em templates HTML, apesar do catálogo e do perfil já terem recebido endurecimento em outras telas.
- Adicionado helper de escape HTML no checkout para nome/data/horário de retirada, itens, totais exibidos, nome, e-mail e WhatsApp do cliente.
- Avatar do cliente no checkout agora aceita somente URL HTTPS válida antes de entrar no atributo `src`; em caso contrário usa a inicial do nome.
- O checkout continua server-authoritative: preços seguem vindo de `padoka_products` e o envio do pedido continua pela RPC existente/idempotente quando disponível; nenhuma lógica de preço foi movida para o navegador.
- Criado `tests/checkout-rendering-audit.mjs` para impedir regressão de dados crus em `innerHTML` e exigir validação HTTPS do avatar.
- O workflow `.github/workflows/padoka-audit.yml` agora executa essa auditoria em push/PR.
- Nenhuma migration, RLS ou objeto de banco foi alterado nesta execução.
- Confirmado novamente que a conexão Supabase disponível expõe somente **InfoTech.io** (`rgngqumqzylthdiazvfu`). Nenhuma query, migration, advisor ou alteração foi executada nesse projeto; o backend correto da PADOKA continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`).
