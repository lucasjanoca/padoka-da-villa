# 2026-08-28 22:27 — Retry de ajuste de estoque preservado em falha de transporte

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração, preservando o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e o isolamento `padoka_*`.
- Identificado que o ajuste manual de estoque já usa `padoka_adjust_inventory_once` com `request_id` idempotente e retry vinculado ao `user_id`, mas uma rejeição real da Promise de transporte podia escapar do `await` e manter o campo desabilitado sem feedback de retry.
- `assets/operational-sync.js` agora captura também rejeições de transporte no ajuste manual, trata a resposta como ambígua e preserva o mesmo `request_id`, produto, delta e saldo-alvo para nova tentativa segura.
- A tentativa só é removida quando o servidor confirma sucesso ou retorna erro determinístico; falha de rede continua orientando o funcionário a repetir exatamente a mesma operação.
- `tests/operational-inventory-audit.mjs` foi ampliado para exigir captura explícita da rejeição de transporte e preservação do erro ambíguo para retry.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada nesta rodada; não houve mudança de banco que exigisse consulta aos Security Advisors.
- Nenhum objeto não-PADOKA e nenhum projeto InfoTech.io foram alterados.
