## 2026-09-02 11:26 — Checkout passa a depender somente do runtime central

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` e confirmado que a PADOKA continua vinculada exclusivamente ao projeto Supabase **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`), sem alterações no projeto InfoTech.io.
- `assets/checkout-page.js` deixou de possuir fallback próprio para buscar `padoka-public-config`; o fechamento agora exige `PADOKA_RUNTIME.getPublicConfig()` e falha fechado se o runtime central estiver indisponível.
- O checkout valida em defesa em profundidade `scope = padoka`, origin exato `https://yncspxfsvlqdnodlsosb.supabase.co`, chave `sb_publishable_*` ou JWT legado somente com `role = anon`, e confere novamente o origin do cliente Supabase antes de consultar catálogo, sessão ou perfil.
- O fluxo de pagamento na retirada permanece server-authoritative pela RPC idempotente `padoka_create_order_once_v3`; o Pix automático continua bloqueado até existir provedor real com confirmação autenticada.
- `tests/order-backend-isolation-audit.mjs` foi atualizado para o contrato atual `once_v3` e passou a impedir fallback para `once`/`once_v2`, bypass do runtime central, uso de backend diferente ou exposição de credenciais privilegiadas.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function, credencial Google ou objeto não-`padoka_` foi alterado nesta execução.
