# PDV: auditoria da fronteira de backend no estorno

- adiciona `tests/pdv-sale-void-backend-boundary-audit.mjs` para proteger a cadeia de isolamento do histórico/estorno de vendas;
- exige que o PDV permaneça fixado no projeto Supabase da PADOKA (`yncspxfsvlqdnodlsosb`) e falhe fechado se outro origin for usado;
- garante que `pdv-sale-void.js` continue carregando apenas após a autorização interna de papel e mantendo `owner`/`manager` para estorno;
- valida que consultas/RPCs do módulo usem somente o namespace `padoka_*`, sem `service_role`, `sb_secret_`, InfoTech.io ou escrita direta de venda/estoque;
- preserva o estorno server-authoritative por `padoka_void_sale`, reconfirmação de sessão e limpeza de Realtime na troca de funcionário.

Nenhuma migration, policy RLS, grant, trigger, Edge Function ou configuração de provedor Auth foi alterada nesta mudança.
