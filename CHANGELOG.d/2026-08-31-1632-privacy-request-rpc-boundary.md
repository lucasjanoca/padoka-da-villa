## 2026-08-31 16:32 — Solicitações de privacidade passam a ser RPC-only

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` e confirmado o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); o projeto InfoTech.io permaneceu intocado.
- Revisadas RLS e policies de `padoka_privacy_requests`: a criação pelo cliente ainda dependia de `INSERT` direto apesar de `conta.html` já usar `padoka_request_privacy_action`.
- Criada e aplicada a migration `074_privacy_request_rpc_boundary.sql`.
- A implementação de criação agora fica em `padoka_rpc_private.request_privacy_action`, com `SECURITY DEFINER`, `search_path=''`, identidade fixada por `auth.uid()` e validação explícita de tipo/detalhes.
- O endpoint público `padoka_request_privacy_action` permanece `SECURITY INVOKER`; `anon` não possui execução e `authenticated` só alcança a implementação privada por esse wrapper.
- `authenticated` e `anon` ficaram sem `INSERT` direto em `padoka_privacy_requests`, e a policy `padoka_privacy_own_insert` foi removida. A tabela continua com RLS ativa e somente a policy de leitura autorizada permanece.
- Adicionado índice parcial único por `(user_id, request_type)` para impedir duas solicitações ativas iguais em condição de concorrência; o backend converte colisão em `request already pending`.
- Criado `tests/privacy-request-rpc-boundary-audit.mjs` para impedir regressão de grants/policy diretos e exigir que `conta.html` continue usando a RPC.
- Security Advisor executado antes e depois: nenhum novo alerta da PADOKA. Permanecem apenas avisos já existentes de funções `rass_*` e da proteção global contra senhas vazadas, sem alterações em objetos de outros sistemas.
