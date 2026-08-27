# 2026-08-27 — Seus pedidos limpa sessão anterior com segurança

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração.
- Confirmado que o GitHub Pages e o `PADOKA Static Audit #278` da `main` publicada estavam concluídos com sucesso antes desta correção.
- Corrigido o lifecycle de autenticação em `acompanhamento.html` sem alterar layout, estilos, textos visuais ou navegação.
- A página agora reage a `onAuthStateChange`, remove o canal Realtime do cliente anterior e limpa itens/eventos renderizados imediatamente no logout ou troca de conta.
- Respostas assíncronas de uma sessão antiga são invalidadas por geração antes de alterar a tela, evitando que pedidos do cliente anterior reapareçam após uma troca de sessão.
- O novo canal Realtime continua filtrado por `customer_id` e os pedidos continuam sendo consultados explicitamente pelo UUID autenticado.
- `tests/customer-orders-audit.mjs` foi ampliado para impedir regressão do lifecycle de sessão, mantendo a página sem campo de pesquisa e sem assinatura global de `padoka_order_events`.
- Nenhuma migration, RLS, grant, trigger, Edge Function ou dado do Supabase foi alterado nesta execução.
- O backend oficial permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e o projeto InfoTech.io não foi alterado.
