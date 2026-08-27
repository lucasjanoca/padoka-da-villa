# 2026-08-27 — Auditoria automática da Edge Function Pix

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração, preservando o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e o isolamento `padoka_*`.
- Confirmado no Supabase correto que o projeto está `ACTIVE_HEALTHY` e que a Edge Function `padoka-pix-checkout` está ativa com `verify_jwt=true`; nenhuma função ou objeto de outros sistemas foi alterado.
- Revisado o código de `supabase/functions/padoka-pix-checkout/index.ts`: CORS permanece restrito a `https://lucasjanoca.github.io`, chamadas exigem Bearer token validado via Auth, o pedido precisa pertencer ao usuário autenticado e o provider de pagamento continua falhando fechado enquanto não houver adapter/configuração real.
- Criado `tests/pix-edge-security-audit.mjs` para impedir regressões como CORS wildcard, dependência Supabase sem versão fixada, ausência de validação JWT, consulta a objetos não-`padoka_`, confiança em valor/status/txid enviados pelo navegador ou remoção do fail-closed do provider.
- O workflow `PADOKA Static Audit` agora valida a sintaxe e executa essa auditoria em cada push/PR para `main`.
- Nenhuma credencial Google/Pix foi inventada, nenhum secret/service role foi adicionado ao frontend e nenhum HTML/CSS foi alterado.
- Nenhuma mudança de banco, RLS ou grant foi necessária nesta rodada.
