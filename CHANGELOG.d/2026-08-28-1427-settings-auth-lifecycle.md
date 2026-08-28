## 2026-08-28 14:27 — Configurações internas isoladas entre identidades staff

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração, mantendo como backend exclusivo da PADOKA o projeto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`).
- Identificada uma corrida em `assets/settings-sync.js`: apesar de já reagir a `onAuthStateChange`, respostas atrasadas de `padoka_get_settings` ou `padoka_update_settings` podiam chegar depois de logout/troca de conta e voltar a preencher ou habilitar controles usando o runtime anterior.
- O módulo de configurações agora vincula operações assíncronas a `activeUserId` + `lifecycleEpoch` e revalida a sessão via `sb.auth.getSession()` antes de aplicar respostas de leitura ou gravação.
- Durante logout/troca de conta, os controles ficam fail-closed, o canal Realtime anterior é removido e a nova identidade só ativa o módulo depois de o guard interno concluir a revalidação de `padokaStaffRole` para `owner`/`manager`.
- Callbacks Realtime também ficam associados à identidade que criou o canal; eventos atrasados da sessão anterior deixam de disparar carregamento na nova conta.
- `tests/settings-sync-audit.mjs` foi ampliado para exigir lifecycle epoch, vínculo ao `user_id`, revalidação de sessão, espera por `padoka-staff-pending`/`padoka-role-pending` e descarte de callbacks antigos.
- `AUTH_STATUS.md` atualizado para documentar o isolamento das configurações internas.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada nesta rodada; nenhum objeto fora de `padoka_` foi modificado e o projeto InfoTech.io permaneceu intocado.
