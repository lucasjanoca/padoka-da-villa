## 2026-09-04 00:33 — Configurações internas ganham contrato mais rígido contra resposta de sessão antiga

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` e confirmado o HEAD antes da alteração.
- Confirmado que o backend correto permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); o projeto InfoTech.io não foi alterado.
- Revisado `assets/settings-sync.js`: o runtime já captura `lifecycleEpoch` + `activeUserId`, valida sessão antes das RPCs `padoka_get_settings`/`padoka_update_settings`, revalida depois da resposta, encerra o canal Realtime na troca de identidade e mantém controles bloqueados até confirmar `owner`/`manager`.
- `tests/settings-sync-audit.mjs` foi endurecido para verificar também a ordem dessas proteções: a revalidação pós-RPC deve ocorrer antes de preencher/renderizar dados ou reabilitar controles; a resposta de salvamento só pode ser aplicada depois da mesma revalidação; e a inscrição Realtime só pode iniciar após uma carga bem-sucedida ainda vinculada ao mesmo funcionário.
- O `PADOKA Static Audit #1362` passou no commit funcional `b8e9ce1e01a79bd6f8c36fd487dc1f87747d5482`. O CodeQL correspondente ainda estava em execução no momento deste registro.
- Não houve alteração de runtime funcional, banco, migration, RLS, policy, grant, trigger, Edge Function, OAuth Google ou objeto não-`padoka_`; portanto não foi necessário executar Security Advisors nesta rodada.
