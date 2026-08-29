# 2026-08-29 09:30 — Estoque e planejamento recuperam falhas reais de rede

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` no HEAD `26f1aa3935ab7625e92ef3969bfb32ee79daa8dc` antes da alteração.
- Confirmado que a PADOKA continua apontando exclusivamente para **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o InfoTech.io não faz parte do backend deste projeto.
- Identificado que `assets/operational-sync.js` já capturava rejeições de transporte no ajuste idempotente de saldo, mas `padoka_update_inventory_metadata` e `padoka_upsert_production_plan` ainda podiam rejeitar o `await` e deixar o fluxo sem recuperação amigável.
- `saveMeta` e `savePlan` agora capturam rejeições reais de transporte, normalizam o erro e somente exibem feedback depois de reconfirmar `user_id + lifecycleEpoch` da sessão interna ativa.
- Falhas de conexão exibem mensagem amigável e tentam recarregar o estado autoritativo do servidor; se essa reconciliação também falhar, a Gestão entra no estado operacional indisponível/fail-closed em vez de manter dados potencialmente desatualizados como editáveis.
- As operações continuam usando exclusivamente as RPCs server-authoritative existentes; não foi adicionado `UPDATE`/`UPSERT` direto de navegador.
- `tests/operational-inventory-audit.mjs` passou a exigir captura explícita das rejeições de transporte e mensagens de recuperação para metadados do estoque e planejamento da produção.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada. Nenhum objeto não-`padoka_` e nenhum recurso do InfoTech.io foi tocado.