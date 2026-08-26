## 2026-08-26 — Auditoria fail-closed da Gestão operacional

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `gestao.html`, `assets/operational-sync.js` e a Issue #1 antes da mudança.
- Confirmado que `gestao.html` ainda contém o legado local demonstrativo documentado na Issue #1; a remoção não foi feita nesta rodada para evitar uma reescrita ampla do HTML minificado sem uma etapa de proteção automatizada primeiro.
- Criado `tests/operational-fail-closed-audit.mjs` para garantir que a camada operacional real continue usando somente `padoka_inventory`, `padoka_production_plans`, `padoka_losses` e as RPCs `padoka_adjust_inventory`, `padoka_update_inventory_metadata`, `padoka_upsert_production_plan` e `padoka_register_loss`.
- A auditoria proíbe `localStorage`/`sessionStorage` dentro de `assets/operational-sync.js`, exige que a sincronização espere a área interna autenticada e que a interface comece bloqueada até o backend seguro carregar.
- O novo teste foi integrado ao workflow `PADOKA Static Audit`, criando uma rede de segurança antes da futura remoção pequena e revisável do legado de `gestao.html`.
- Nenhuma migration, RLS, grant, trigger, Edge Function ou dado foi alterado. O backend permanece `Sites De Clientes!` (`yncspxfsvlqdnodlsosb`) e o projeto InfoTech.io não foi tocado.
