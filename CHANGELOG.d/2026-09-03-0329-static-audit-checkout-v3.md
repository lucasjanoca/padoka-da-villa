# 2026-09-03 03:29 — Static Audit alinhado ao checkout v3

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração; confirmado que a PADOKA continua vinculada ao projeto Supabase **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o InfoTech.io permanece fora do escopo.
- O `PADOKA CodeQL #464` e o GitHub Pages do HEAD anterior passaram, mas o `PADOKA Static Audit #1306` falhou apenas porque `tests/static-audit.mjs` ainda exigia a RPC antiga `padoka_create_order_once`.
- Confirmado no runtime atual que o checkout usa exclusivamente `padoka_create_order_once_v3`, com `request_id` idempotente, sessão revalidada e Pix automático mantido fail-closed enquanto não houver integração real.
- Atualizada a auditoria estática para exigir `padoka_create_order_once_v3` e também rejeitar explicitamente o retorno das variantes legadas `padoka_create_order_once` e `padoka_create_order_once_v2` no controlador idempotente.
- Nenhum HTML, CSS, runtime de produção, migration, RLS, policy, grant, trigger, Edge Function ou configuração Google OAuth foi alterado nesta execução.
- Nenhum objeto não-`padoka_` foi alterado e nenhuma credencial privilegiada foi adicionada ao repositório.
