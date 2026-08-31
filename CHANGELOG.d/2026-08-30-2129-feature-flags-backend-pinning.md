# 2026-08-30 21:29 — Feature flags fixadas no backend PADOKA

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração.
- Confirmado que o backend correto continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o projeto InfoTech.io não deve ser usado pela PADOKA.
- Identificado que `assets/feature-flags.js` buscava a configuração pública no endpoint correto da PADOKA, porém aceitava `cfg.url` sem validar a origem antes de consultar `padoka_feature_flags`.
- O runtime agora fixa `PADOKA_ORIGIN` em `https://yncspxfsvlqdnodlsosb.supabase.co`, valida que `cfg.url` possui exatamente essa origem e permanece fail-closed caso a configuração aponte para outro backend ou não forneça chave pública utilizável.
- A consulta continua restrita a `padoka_feature_flags` com `audience=public`; nenhuma chave administrativa foi adicionada ao frontend.
- `tests/backend-isolation-audit.mjs` agora exige explicitamente o pinning da origem e rejeita regressão para uso direto de `cfg.url`.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada nesta execução; não houve ampliação de privilégios nem alteração de objetos não-`padoka_`.
- Layout, catálogo, checkout, acompanhamento de pedidos, imagens e áreas internas permaneceram inalterados.
