# 2026-09-03 03:38 — Auditoria da fronteira de telemetria alinhada ao runtime atual

- O Static Audit confirmou que o checkout v3 e todas as auditorias anteriores passaram e avançou até `telemetry-boundary-audit.mjs`.
- A falha era do matcher antigo: ele procurava um `ENDPOINT` com URL literal, enquanto o runtime atual deriva `ENDPOINT` de `PADOKA_ORIGIN`.
- Confirmado que páginas internas abortam antes da criação do endpoint e antes de qualquer leitura/criação de sessão de telemetria.
- A auditoria agora exige explicitamente `PADOKA_ORIGIN='https://yncspxfsvlqdnodlsosb.supabase.co'`, exige que o endpoint derive desse origin e preserva `credentials:'omit'`.
- Nenhum runtime de produção, migration, RLS, policy, grant, trigger, Edge Function, configuração Google OAuth ou objeto não-`padoka_` foi alterado.
