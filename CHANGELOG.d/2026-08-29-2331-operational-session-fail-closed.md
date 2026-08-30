# 2026-08-29 23:31 — Gestão operacional falha fechada em erros de sessão

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração; confirmado que a PADOKA permanece no Supabase **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o projeto InfoTech.io não deve ser usado.
- Revisado `assets/operational-sync.js`, responsável por estoque, planejamento de produção, perdas e relatórios internos em `gestao.html`.
- Identificado que `sessionStillMatches`, `waitForStaffGuard` e o bootstrap ainda chamavam `auth.getSession()` diretamente, permitindo que uma rejeição real de transporte escapasse do fluxo de validação.
- Criado `safeSession()` para centralizar a confirmação de sessão, tratar tanto `error` retornado pelo Supabase Auth quanto rejeições de rede e retornar `null` em qualquer falha, mantendo a área operacional fail-closed.
- `sessionStillMatches`, `waitForStaffGuard` e `start` agora dependem exclusivamente de `safeSession()`; se a identidade não puder ser confirmada, estoque/produção/perdas não são liberados.
- O bootstrap ganhou captura final de rejeições inesperadas e bloqueia novamente a interface com mensagem amigável em vez de deixar uma Promise rejeitada sem tratamento.
- O retry idempotente de ajuste de estoque continua vinculado ao `user_id` em `sessionStorage`, preservando o mesmo `request_id` para reconciliação segura e sem criar fallback local.
- `tests/operational-fail-closed-audit.mjs` agora exige `safeSession()`, tratamento explícito do campo `error`, captura de falha de rede, centralização de `getSession()` e captura do bootstrap.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada nesta execução; não houve ampliação de privilégios nem necessidade de alterar objetos não-`padoka_`.
