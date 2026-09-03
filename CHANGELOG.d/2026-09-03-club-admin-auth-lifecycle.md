# 2026-09-03 — PADOKA Club interno limpa estado privilegiado na troca de sessão

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração.
- Mantido o backend exclusivamente em **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); nenhuma alteração foi feita no InfoTech.io.
- Identificado estado visual residual no `club-admin`: após uma sessão `owner`/`manager`, a classe `manager` do `body` não era removida dentro da limpeza imediata de lifecycle.
- `assets/club-admin.js` agora remove `manager` em `clearAdminUi()` antes de qualquer revalidação da próxima identidade, junto da limpeza de `role`, recompensas, campanhas, cliente selecionado e lookup em memória.
- `tests/club-admin-lifecycle-audit.mjs` passou a exigir a remoção imediata do estado `manager`, a ocultação fail-closed da aplicação interna e a limpeza dos dados privilegiados antes da revalidação de sessão.
- Foram preservados `padoka_staff_users`, allowlist explícita de papéis, MFA/AAL2 para `owner`/`manager`, RPCs server-authoritative e bloqueio de `service_role`/`sb_secret_` no navegador.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function ou objeto não-`padoka_` foi alterado nesta rodada.
