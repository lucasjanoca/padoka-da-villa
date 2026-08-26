# Backend PADOKA e cadeia de migrations realinhados

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração.
- Confirmado no Supabase correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) que `padoka_update_order_status` está ativo, `padoka_sales` existe e `authenticated` não possui `UPDATE` direto em `padoka_orders`.
- A lista de migrations do backend revelou alterações de 26/08 que ainda não estavam totalmente representadas no GitHub.
- Migrations relacionadas ao painel `production_*`, `employees`, `notices` e outros objetos não-PADOKA foram deliberadamente ignoradas neste repositório, preservando o isolamento entre sistemas do projeto compartilhado.
- Criada `supabase/031_optimize_padoka_rls_evaluation.sql` como espelho exato da otimização RLS PADOKA já aplicada no backend, sem reaplicar DDL no banco.
- A migration 031 mantém `auth.uid()` em subselect para reduzir reavaliação por linha, consolida leituras autorizadas de perfil/staff e preserva o isolamento de clientes, equipe e pedidos.
- O advisor de segurança foi consultado; avisos de tabelas PADOKA privadas sem policy permanecem intencionais quando não há acesso direto pelo navegador, e avisos de `SECURITY DEFINER` não foram “corrigidos” removendo autenticação/autorização ou ampliando privilégios.
- Nenhum objeto InfoTech.io foi alterado e nenhum objeto não-`padoka_` foi modificado nesta execução.
