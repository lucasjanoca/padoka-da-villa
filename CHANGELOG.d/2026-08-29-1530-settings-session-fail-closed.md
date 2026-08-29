# 2026-08-29 15:30 — Configurações internas falham fechadas em erro de sessão

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md` e o estado atual do repositório antes da alteração.
- Confirmado que o backend correto permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o projeto InfoTech.io não foi alterado.
- `assets/settings-sync.js` agora centraliza a leitura de sessão em `safeSession()`, capturando tanto erros retornados pelo Auth quanto rejeições de transporte de `getSession()`.
- `identityStillCurrent`, `waitForRole`, `activateForUser` e o carregamento inicial usam essa confirmação protegida; sem sessão confirmada, os controles continuam bloqueados e nenhum estado da identidade anterior é reaproveitado.
- A tela de Configurações entra em modo fail-closed antes da primeira leitura de sessão, evitando que falhas de rede deixem o salvamento local/legado disponível.
- `load` e `save` continuam usando somente `padoka_get_settings` e `padoka_update_settings`, com revalidação por `lifecycleEpoch + user_id` antes de aplicar respostas.
- `tests/settings-sync-audit.mjs` foi ampliado para exigir captura de falhas de transporte e confirmação protegida de sessão no startup, espera de papel e ativação.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada nesta execução; não houve ampliação de privilégios nem alteração em objetos não-`padoka_`.
