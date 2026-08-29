# 2026-08-29 08:30 — Fila de pedidos valida staff antes da primeira exibição

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` no HEAD anterior `2bd834a361b0457987d374a2412aecbf2bcc70a9` antes da alteração.
- Confirmado que a PADOKA continua apontando exclusivamente para **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o InfoTech.io não faz parte do backend deste projeto.
- Identificado que `assets/orders-auth-lifecycle.js` já iniciava `pedidos.html` em modo fail-closed e revalidava `padoka_staff_users` nas trocas de identidade, mas no primeiro carregamento removia o bloqueio dedicado depois de confirmar apenas a sessão Auth.
- O guard dedicado agora consulta `padoka_staff_users` e exige `active = true` antes de remover `padoka-orders-auth-transition` no primeiro carregamento.
- Depois da consulta de staff, a sessão é lida novamente e a identidade inicial é comparada com `activeUserId`; se a conta tiver mudado durante a validação, a fila continua bloqueada e nenhuma autorização antiga é aplicada.
- Erro de transporte, erro na consulta de staff, ausência de sessão ou staff inativo permanecem fail-closed e retornam para `internal.html`; nenhum acesso foi ampliado para contornar falhas.
- `tests/staff-navigation-audit.mjs` agora exige a validação inicial de `padoka_staff_users`, a releitura da sessão e a ordem correta: somente depois dessas confirmações a fila pode ser revelada.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada. Nenhum objeto não-`padoka_` e nenhum recurso do InfoTech.io foi tocado.
