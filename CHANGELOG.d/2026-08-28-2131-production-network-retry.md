# 2026-08-28 21:31 — Produção preserva retry em rejeição de transporte

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `assets/production-completion.js` e `tests/production-transaction-audit.mjs` antes da alteração.
- Confirmado que o backend documentado da PADOKA permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que nenhuma mudança desta rodada exige tocar no projeto InfoTech.io.
- Identificado que `padoka_record_production` já usa `request_id` persistido e escopado pelo `user_id`, porém uma rejeição real de transporte/fetch escapava do `await sb.rpc(...)` antes de restaurar a interface para retry.
- `assets/production-completion.js` agora captura também rejeições de transporte e mantém a mesma tentativa persistida, quantidade e `request_id`; o botão volta para `Tentar novamente` sem criar uma segunda operação.
- A validação de `lifecycleEpoch + user_id` continua acontecendo antes de qualquer resposta alterar a interface, evitando que uma falha/resposta antiga seja aplicada depois de troca de funcionário.
- `tests/production-transaction-audit.mjs` passou a exigir captura explícita de rejeição de transporte ao redor de `padoka_record_production`, além das verificações existentes de idempotência, isolamento por identidade, autorização e ausência de escrita direta no estoque.
- Nenhuma migration, RLS, grant, RPC, Edge Function ou secret foi alterado nesta rodada; portanto não houve ampliação de privilégios nem mudança de objetos não-`padoka_`.
