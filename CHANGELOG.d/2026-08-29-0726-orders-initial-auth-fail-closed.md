## 2026-08-29 07:26 — Fila de pedidos nasce fail-closed antes da sessão inicial

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração, preservando o backend **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e sem tocar no projeto InfoTech.io.
- Identificado que `assets/orders-auth-lifecycle.js` adicionava o bloqueio visual somente durante uma troca de identidade; uma rejeição de transporte em `auth.getSession()` na inicialização podia encerrar `start()` antes de o guard dedicado esconder a fila.
- O guard `padoka-orders-auth-transition` agora é ativado imediatamente após instalar seu CSS, antes de aguardar o cliente Supabase ou ler a sessão.
- A leitura inicial de `auth.getSession()` agora é protegida por `try/catch`; falha de rede/autenticação mantém a fila oculta e redireciona para `internal.html`, sem liberar dados ou controles por fallback.
- Ausência de sessão autenticada também permanece fail-closed; a classe de transição só é removida depois que a sessão inicial foi obtida com sucesso.
- O comportamento existente de troca/logout foi preservado: canais Realtime são encerrados, cada transição invalida a anterior por `lifecycleEpoch` e uma nova identidade precisa ser revalidada em `padoka_staff_users` antes de reutilizar a página.
- `tests/staff-navigation-audit.mjs` foi ampliado para impedir regressão do bloqueio inicial, exigir captura da leitura de sessão e garantir que a fila não seja revelada sem sessão confirmada.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada nesta execução; não houve motivo para ampliar privilégios nem modificar objetos não-`padoka_`.
