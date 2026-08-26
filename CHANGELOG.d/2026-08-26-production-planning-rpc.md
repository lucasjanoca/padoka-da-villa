# 2026-08-26 — Planejamento de produção passa a usar RPC autoritativa

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` e revisado o estado atual do repositório antes da alteração.
- Confirmado no Supabase que o backend correto é **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e está `ACTIVE_HEALTHY`; nenhum objeto do projeto InfoTech.io foi acessado ou alterado.
- A revisão de privilégios mostrou que `authenticated` possui somente `SELECT` em `padoka_production_plans`, portanto o `upsert` direto que ainda existia em `assets/operational-sync.js` deixou de ser compatível com o endurecimento de privilégios aplicado anteriormente.
- Criada e aplicada a migration `032_production_plan_rpc.sql` com a RPC `padoka_upsert_production_plan`, mantendo o planejamento server-authoritative sem devolver `INSERT`/`UPDATE` direto ao navegador.
- A RPC é `SECURITY DEFINER`, fixa `search_path = public`, exige `auth.uid()`, permite apenas `owner`, `manager` ou `production`, valida produto ativo, data, quantidade e tamanho da observação, revoga acesso de `public`/`anon` e concede somente `EXECUTE` a `authenticated`.
- `assets/operational-sync.js` passou a salvar o planejamento exclusivamente por `padoka_upsert_production_plan`; o frontend não faz mais `upsert` direto em `padoka_production_plans`.
- `tests/operational-inventory-audit.mjs` foi ampliado para exigir a RPC, autenticação/autorização, ACL, `search_path` fixo e ausência do `upsert` direto.
- O primeiro CI com a migration 032 falhou apenas porque a auditoria textual exigia a forma não-aspada `search_path = public`; o banco já registrava efetivamente `search_path=public`. O arquivo e o teste específico foram alinhados à guarda existente sem nova mudança funcional no banco.
- Os advisors de segurança foram consultados antes e depois da DDL. O advisor passou a listar a nova RPC como `SECURITY DEFINER` executável por `authenticated`; isso é intencional e foi revisado porque a própria RPC aplica autenticação e papel permitido, enquanto as escritas diretas da tabela permanecem revogadas. Nenhuma proteção foi removida para silenciar o aviso.
- Avisos referentes a objetos não-PADOKA do projeto compartilhado não foram alterados. As tabelas privadas PADOKA que não precisam de acesso direto do navegador também não receberam policies desnecessárias.
