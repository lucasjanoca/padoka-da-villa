# 2026-08-29 03:27 — Configurações recuperam falhas reais de transporte

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração, confirmando o backend exclusivo da PADOKA como **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e mantendo o InfoTech.io fora desta execução.
- Revisado `assets/settings-sync.js`: as RPCs `padoka_get_settings` e `padoka_update_settings` já eram server-authoritative, restritas ao lifecycle de staff e sem fallback local, porém uma rejeição real de transporte podia escapar do `await`.
- O carregamento de configurações agora captura rejeições de rede, revalida `lifecycleEpoch + user_id` antes de qualquer feedback e mantém os controles fail-closed quando o servidor não pode ser confirmado.
- O salvamento agora captura rejeições de rede, revalida a mesma identidade antes de tocar na interface e libera novamente o botão para uma tentativa segura. Como a RPC grava o estado informado (horários/meio de pagamento/observação), repetir após uma resposta de transporte ambígua não cria uma operação acumulativa de estoque ou caixa.
- `tests/settings-sync-audit.mjs` passou a exigir captura explícita dessas falhas e a preservação das barreiras de identidade durante a recuperação.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada; não houve ampliação de privilégios nem mudança em objetos não-`padoka_`.
