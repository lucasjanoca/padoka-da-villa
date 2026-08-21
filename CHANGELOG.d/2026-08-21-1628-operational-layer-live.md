# 2026-08-21 16:28 — Camada operacional 003 ativada no backend correto

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração.
- O conector Supabase passou a resolver explicitamente o projeto correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`), organização `Produção`; o projeto **InfoTech.io não foi alterado**.
- Conferido o estado real do banco antes do rollout: apenas a base PADOKA de clientes/pedidos/catálogo estava ativa (`padoka_profiles`, `padoka_staff_users`, `padoka_products`, `padoka_orders`, `padoka_order_items`, `padoka_order_events`).
- Aplicada no projeto correto a camada equivalente a `003_operational_inventory_production_losses.sql`, criando `padoka_inventory`, `padoka_inventory_movements`, `padoka_production_plans`, `padoka_losses` e as RPCs operacionais previstas, todas isoladas por `padoka_` e sem trigger global em `auth.users`.
- O inventário foi inicializado com uma linha para cada produto ativo do catálogo: 16 produtos ativos e 16 linhas de estoque; nenhum plano de produção nem perda foi inventado.
- Rodados advisors após a migration 003. O advisor de segurança não apontou erro novo de RLS nas tabelas PADOKA; os avisos PADOKA observados são as RPCs `SECURITY DEFINER` expostas a `authenticated`, intencionalmente protegidas por checagem de função interna. Avisos de outros namespaces não foram alterados.
- O advisor de performance apontou FKs PADOKA sem índice e confirmou que as novas tabelas operacionais ainda não estavam na publicação `supabase_realtime`.
- Criada `019_operational_realtime_indexes.sql` para adicionar índices de apoio e publicar somente `padoka_inventory`, `padoka_inventory_movements`, `padoka_production_plans` e `padoka_losses` no Realtime.
- A migration 019 foi aplicada com sucesso no projeto correto. Foi confirmado que `padoka_orders` e as quatro tabelas operacionais estão agora na publicação `supabase_realtime`, permitindo que `assets/operational-sync.js` receba mudanças em tempo real.
- `tests/migration-chain-audit.mjs` foi ampliado para a cadeia contínua `001→019` e passou a exigir os objetos da migration 019.
- A tentativa de consultar novamente os advisors depois da 019 retornou erro transitório `404 Link not found` do conector; não foi assumido resultado de segurança/performance sem evidência. Repetir os advisors na próxima execução antes de avançar o rollout.
- Próximo gate seguro: repetir advisors, validar a Gestão com conta staff real e somente então avançar para a próxima migration operacional da sequência.
