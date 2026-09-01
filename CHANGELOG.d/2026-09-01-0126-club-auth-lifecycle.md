# 2026-09-01 01:26 — PADOKA Club isolado por lifecycle de autenticação

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração e confirmado o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`).
- O novo `club.html`/`assets/club.js` foi revisado depois da entrada do PADOKA Club completo no repositório.
- Identificado que a tela do cliente mantinha saldo, histórico e resgates em memória caso houvesse logout/troca de conta em outra aba até que a página fosse recarregada.
- `assets/club.js` agora acompanha `onAuthStateChange`, incrementa `lifecycleEpoch`, limpa imediatamente todo estado da identidade anterior e só volta a revelar a tela depois de revalidar a nova sessão.
- Resgates e cancelamentos capturam `user_id + lifecycleEpoch`, revalidam a sessão antes da RPC e descartam respostas atrasadas depois de troca de identidade.
- As consultas de conta, extrato e resgates também usam o `user_id` capturado e não aplicam resultados se a identidade tiver mudado durante as requisições.
- O runtime do PADOKA Club passou a fixar explicitamente o project ref `yncspxfsvlqdnodlsosb`: a resposta de `padoka-public-config` só é aceita se a origem corresponder ao Supabase esperado, e `createClient` não usa mais `cfg.url` diretamente.
- A auditoria `tests/loyalty-security-audit.mjs` passou a exigir o pinning do backend, o lifecycle fail-closed e a ausência de regressão para `createClient(cfg.url, ...)`.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function ou objeto não-`padoka_` foi alterado nesta rodada.
- O Security Advisor foi consultado antes das alterações e não apresentou alerta relacionado à PADOKA; os avisos existentes `rass_*` e a proteção global contra senhas vazadas permaneceram intocados.
