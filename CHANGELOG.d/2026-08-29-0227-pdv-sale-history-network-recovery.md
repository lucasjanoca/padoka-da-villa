# 2026-08-29 02:27 — Histórico/estorno do PDV recupera falhas de transporte

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` e confirmado o estado atual do repositório antes da alteração.
- Confirmado que o backend documentado da PADOKA continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o projeto InfoTech.io não faz parte deste fluxo.
- `assets/pdv-sale-void.js` agora captura rejeições reais de transporte ao carregar o histórico de vendas e os itens de uma venda, evitando que a interface permaneça indefinidamente em `Atualizando vendas…` ou `Carregando itens…`.
- Depois de uma falha de rede, o histórico apresenta recuperação explícita pelo botão `Atualizar`; detalhes da venda também retornam mensagem amigável para nova tentativa.
- As verificações de `lifecycleEpoch` + `activeUserId` continuam ocorrendo antes de qualquer resposta assíncrona ser aplicada à interface, preservando o isolamento entre funcionários em troca/logout de sessão.
- O estorno continua exclusivamente pela RPC transacional `padoka_void_sale`; não foi criado `UPDATE` direto de vendas/estoque no navegador e a reconciliação de resultado ambíguo foi preservada.
- `tests/pdv-sale-void-audit.mjs` agora exige tratamento explícito das rejeições de transporte tanto no histórico quanto nos detalhes da venda.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada nesta execução; portanto não houve mudança de banco que exigisse nova consulta aos Security Advisors.
- Nenhum objeto não-`padoka_` foi alterado.
