# 2026-08-28 10:29 — Retry do PDV isolado por funcionário

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` no estado atual antes da alteração.
- Confirmado o backend correto da PADOKA como **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); nenhum objeto, credencial ou configuração do projeto InfoTech.io foi alterado.
- Identificado que `assets/pdv-idempotency.js` ainda armazenava retries ambíguos sob uma única chave `padoka_pdv_pending_sale_v1`; a troca de identidade apagava essa tentativa persistida, reduzindo a capacidade de reconciliar uma resposta de rede ambígua com o mesmo `request_id` quando o funcionário original retornasse.
- O PDV agora usa `padoka_pdv_pending_sale_v2:<user_id>`, vinculando a tentativa persistida à identidade do funcionário que iniciou a venda.
- Troca de conta/logout continua limpando carrinho, estado em memória e bloqueando o Caixa até revalidar sessão, papel e capability, mas não mistura nem apaga o retry persistido de outra identidade.
- Ao retornar, somente o mesmo `user_id` pode restaurar sua tentativa; payloads salvos continuam contendo `user_id` e são recusados quando não pertencem à identidade atual.
- A chave compartilhada legada `padoka_pdv_pending_sale_v1` é descartada durante a inicialização para não restaurar estado antigo sem isolamento por funcionário.
- `tests/pdv-idempotency-audit.mjs` foi atualizado para exigir chave escopada, descarte da chave legada, restauração apenas pela identidade correspondente e preservação do retry da conta anterior durante troca de identidade.
- `AUTH_STATUS.md` foi atualizado com o comportamento atual do PDV.
- Nenhuma migration, RLS, grant, RPC, Edge Function ou secret foi alterado nesta rodada; portanto não houve ampliação de privilégios nem alteração de objetos não-`padoka_`.
