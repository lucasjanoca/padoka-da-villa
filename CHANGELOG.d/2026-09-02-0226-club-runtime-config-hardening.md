# 2026-09-02 02:26 — PADOKA Club do cliente passa a depender do runtime central endurecido

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `club.html`, `assets/club.js` e `assets/app-runtime.js` antes da alteração.
- Confirmado que o backend correto continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o projeto InfoTech.io não foi alterado.
- `assets/club.js` deixou de manter fallback próprio de `fetch` para `padoka-public-config`; a configuração pública agora precisa vir de `window.PADOKA_RUNTIME.getPublicConfig()`.
- O módulo valida em defesa em profundidade `scope = padoka`, raiz exata `https://yncspxfsvlqdnodlsosb.supabase.co` e chave pública permitida antes de criar o cliente Supabase ou ler a sessão.
- Chaves modernas precisam usar `sb_publishable_...`; JWT público legado só é aceito quando o payload decodificado contém `role = anon`.
- O cliente Supabase criado também é conferido contra o origin PADOKA antes de ser exposto em `window.padokaSupabase`.
- Resgates e cancelamentos continuam exclusivamente pelas RPCs `padoka_redeem_reward` e `padoka_cancel_loyalty_redemption`; nenhuma escrita direta de saldo de pontos foi introduzida.
- Criado `tests/club-runtime-config-audit.mjs` para impedir regressão do runtime/configuração e preservar o isolamento do backend e das operações server-authoritative.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function ou objeto não-`padoka_` foi alterado nesta execução.
