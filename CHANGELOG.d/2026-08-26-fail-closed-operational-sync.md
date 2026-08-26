# 2026-08-26 — Gestão interna deixa de aceitar fallback local quando o servidor falha

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` e confirmado o estado atual do repositório antes da alteração.
- Confirmado pelo conector Supabase que o backend correto continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e está `ACTIVE_HEALTHY`.
- Nenhuma migration, RLS, grant, trigger ou objeto de banco foi alterado nesta execução; o projeto InfoTech.io não foi acessado nem modificado.
- `assets/operational-sync.js` agora entra em modo **fail-closed** enquanto estoque, produção e perdas não forem carregados do servidor.
- Se qualquer uma das relações operacionais estiver ausente ou indisponível, a interface bloqueia edição e explica que não salvará informações apenas no navegador, evitando que dados locais pareçam oficiais.
- Quando o backend responde corretamente, os controles são liberados e continuam usando as operações reais da PADOKA (`padoka_update_inventory_metadata`, `padoka_adjust_inventory`, `padoka_production_plans` e `padoka_register_loss`).
- `assets/settings-sync.js` também bloqueia os controles e substitui o antigo clique de salvamento enquanto `padoka_get_settings` não puder ser carregada, impedindo que a configuração local demonstrativa seja tratada como persistência válida.
- Os testes `operational-inventory-audit.mjs` e `settings-sync-audit.mjs` foram reforçados para exigir esses comportamentos fail-closed e impedir regressão para fallback local silencioso.
- Como não houve mudança no banco/RLS, não foi necessário executar advisors de segurança nesta rodada.
