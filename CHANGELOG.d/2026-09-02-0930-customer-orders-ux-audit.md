## 2026-09-02 09:30 — Auditoria protege experiência e isolamento de “Seus pedidos”

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md` e `acompanhamento.html` antes da alteração.
- Confirmado que a PADOKA permanece vinculada ao projeto Supabase **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o projeto InfoTech.io não foi alterado.
- Criado `tests/customer-orders-ux-audit.mjs` para impedir regressões na página mobile-first `acompanhamento.html`.
- A auditoria exige ausência de campo de pesquisa, pedidos mais recentes primeiro, destaque `Pode vir buscar!` no status `ready`, progresso `Recebido → Visto → Confirmado → Preparo → Pronto → Retirado`, detalhes expansíveis e lifecycle de autenticação.
- Também exige que leituras e Realtime permaneçam filtrados pelo cliente autenticado, bloqueia exposição de credenciais privilegiadas e impede links públicos para módulos internos de Caixa, Estoque, Produção ou Administração.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function, configuração Google ou objeto não-`padoka_` foi alterado nesta execução.
