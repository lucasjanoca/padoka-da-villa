## Segurança de regressão visual das bebidas

- Adicionada `tests/beverage-visual-distinctness-audit.mjs` para proteger o requisito de catálogo de que expresso, cappuccino, suco e água mantenham metadados visuais próprios e quatro imagens distintas.
- A auditoria também impede que essas bebidas conhecidas caiam no placeholder da logo e preserva o pinning do catálogo público ao projeto Supabase PADOKA `yncspxfsvlqdnodlsosb`, sem credenciais privilegiadas no frontend.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function, configuração OAuth ou objeto não-`padoka_` foi alterado.
