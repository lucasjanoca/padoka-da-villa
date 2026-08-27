# 2026-08-27 12:29 — Retry da produção preserva request_id entre redesenhos

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `assets/production-completion.js`, `assets/operational-sync.js`, `gestao.html`, `assets/internal-nav.js` e `tests/production-transaction-audit.mjs` antes da alteração.
- Identificado que a produção já usava a RPC server-authoritative e idempotente `padoka_record_production`, porém o `request_id` pendente existia somente no botão do DOM.
- Em uma resposta de rede ambígua seguida de atualização Realtime/redesenho da tabela, o botão poderia ser recriado sem o UUID anterior; uma nova tentativa então poderia gerar outro `request_id` e registrar produção/estoque novamente.
- `assets/production-completion.js` agora persiste cada tentativa pendente em `sessionStorage` (`padoka_pending_production_v1`) antes de chamar a RPC e reutiliza exatamente o mesmo `request_id` e quantidade em retries.
- O módulo reconcilia tentativas pendentes consultando `padoka_production_batches` por `request_id`; só remove a pendência quando encontra o lote correspondente com o mesmo `plan_id` e a mesma quantidade, ou quando a própria RPC confirma sucesso.
- Enquanto existe tentativa pendente, a quantidade fica travada e o botão mostra `Tentar novamente`, evitando alterar os dados de uma operação cujo resultado ainda pode estar incerto.
- `tests/production-transaction-audit.mjs` passou a auditar também o frontend: persistência em `sessionStorage`, reutilização do UUID, reconciliação por lote e ausência de escrita direta em estoque.
- Nenhuma migration, RLS, grant ou objeto de banco foi alterado nesta execução; não foi necessário ampliar privilégios nem tocar em objetos não-`padoka_`.
- Nenhum HTML/CSS foi alterado; visual e responsividade da Gestão foram preservados.
