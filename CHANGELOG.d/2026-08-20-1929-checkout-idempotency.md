# 2026-08-20 19:29 — Checkout preparado contra pedido duplicado por retry

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `pagamento.html` e o estado atual das migrations antes da alteração.
- Identificado que o checkout já calculava preço no servidor, porém uma queda de conexão depois do envio poderia levar o cliente a repetir a chamada `padoka_create_order` e criar dois pedidos iguais.
- Criada `supabase/011_checkout_order_idempotency.sql`, destinada somente ao backend **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`). A migration adiciona `request_id` em `padoka_orders`, índice único por cliente e a RPC `padoka_create_order_once`.
- A nova RPC continua exigindo usuário autenticado com onboarding PADOKA concluído, recalcula produtos/preços pelo catálogo ativo e não confia em nome/preço enviados pelo navegador.
- Tentativas concorrentes com o mesmo `request_id` são reconciliadas pelo índice único; repetir exatamente o mesmo pedido retorna o pedido já criado, enquanto reutilizar o identificador com retirada ou itens diferentes é rejeitado como conflito.
- Nenhum trigger em `auth.users` foi criado; `anon/public` não recebem execução da nova RPC.
- Criado `assets/order-idempotency.js`. Quando a coluna `request_id` existir no backend, o checkout passa a gerar UUID por tentativa, gravar a operação pendente em `sessionStorage` e usar `padoka_create_order_once`.
- Em resposta ambígua de rede, o cliente recebe **Tentar novamente** e a interface mantém exatamente o mesmo `request_id` e payload, além de bloquear a edição do carrinho até a tentativa ser reconciliada. Carrinho/retirada só são limpos depois de sucesso confirmado.
- Enquanto a migration 011 não existir no backend publicado, a camada idempotente não assume o botão e o fluxo atual permanece compatível, evitando quebrar o checkout existente.
- Criado `tests/order-idempotency-audit.mjs` e incluído no workflow `.github/workflows/padoka-audit.yml`.
- `node --check` passou para `assets/order-idempotency.js` e `tests/order-idempotency-audit.mjs` no ambiente local desta execução.
- A suíte completa não pôde ser clonada localmente porque o ambiente continuou sem resolver `github.com`; o status combinado do commit do workflow ainda não apresentou checks, então a CI remota não foi marcada como aprovada sem evidência.
- Conferida novamente a conexão Supabase disponível: ela continua expondo somente **InfoTech.io**. Nenhuma migration, SQL, advisor ou alteração foi executada nele; a migration 011 ficou apenas preparada no repositório para o backend PADOKA correto.
