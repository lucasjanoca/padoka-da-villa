# 2026-08-27 — Registro de perdas passa a falhar fechado sem idempotência

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` e confirmado o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`).
- Confirmado no banco que todas as tabelas `padoka_*` atuais permanecem com RLS habilitado e que `authenticated` possui somente `SELECT` nas tabelas operacionais de estoque/movimentações/perdas; nenhuma escrita direta foi ampliada.
- Identificado um fallback legado: `assets/operational-sync.js` ainda podia associar o botão de perdas à RPC não idempotente `padoka_register_loss` enquanto o módulo dedicado verificava a capability de `request_id`.
- `assets/loss-registration.js` agora intercepta o botão desde o carregamento e mantém o registro bloqueado até confirmar que `padoka_losses.request_id` está disponível. Se a capability segura não puder ser confirmada, o fluxo falha fechado e não deixa a ação cair no handler legado.
- O registro efetivo continua exclusivamente pela RPC `padoka_register_loss_once`, preservando o mesmo `request_id` em respostas de rede ambíguas para evitar dupla baixa de estoque.
- Aplicada a migration `033_loss_rpc_exposure_hardening.sql` somente no projeto PADOKA: `padoka_register_loss` deixou de ser executável por `public`, `anon` e `authenticated`, permanecendo apenas para `service_role`; `padoka_register_loss_once` continua liberada para `authenticated` e `service_role`.
- A ACL foi verificada após a migration: RPC legada = `postgres/service_role`; RPC idempotente = `postgres/authenticated/service_role`.
- Security Advisors foram consultados. O aviso da RPC legada deixa de se aplicar ao usuário autenticado; avisos de tabelas privadas PADOKA sem policy foram preservados porque não precisam de acesso direto pelo navegador, e objetos de outros sistemas não foram alterados.
- `tests/loss-transaction-audit.mjs` foi ampliado para exigir a restrição da RPC legada, a disponibilidade da RPC idempotente e o comportamento fail-closed no frontend.
- Nenhum trigger global em `auth.users`, objeto não-`padoka_`, credencial administrativa ou configuração do projeto InfoTech.io foi alterado.
