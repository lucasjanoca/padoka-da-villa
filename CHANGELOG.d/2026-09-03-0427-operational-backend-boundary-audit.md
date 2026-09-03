# 2026-09-03 04:27 — Fronteira de backend dos módulos operacionais protegida

- Adicionada `tests/operational-backend-boundary-audit.mjs` para consolidar em uma única regressão a fronteira de Estoque, Produção, Perdas e Relatórios.
- A auditoria exige o origin exato `https://yncspxfsvlqdnodlsosb.supabase.co`, CSP HTTP/WSS sem wildcard Supabase e rejeição fail-closed de qualquer backend diferente pelo guard interno.
- O teste protege o carregamento de `operational-sync.js` somente depois da validação de `padoka_staff_users` e das permissões próprias de cada módulo: Estoque `owner/manager/stock`, Produção `owner/manager/production`, Perdas `owner/manager/stock/production` e Relatórios `owner/manager`.
- O runtime operacional deve continuar reutilizando o cliente interno validado, revalidando a sessão em torno de I/O, limpando Realtime na troca de sessão e acessando apenas `padoka_inventory`, `padoka_production_plans` e `padoka_losses` para leitura.
- Escritas diretas via `insert/update/upsert/delete` ficam proibidas nesse módulo; mutações devem continuar por RPCs `padoka_*` server-authoritative. A auditoria também bloqueia `service_role`, `sb_secret_` e referências ao InfoTech.io.
- O HEAD anterior `9d2f45015b95d19e051b362a34d00dc7f5d6d9b0` estava estável: PADOKA Static Audit e CodeQL concluíram com sucesso antes desta mudança.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function, configuração Google OAuth, dado comercial ou objeto não-`padoka_` foi alterado.
