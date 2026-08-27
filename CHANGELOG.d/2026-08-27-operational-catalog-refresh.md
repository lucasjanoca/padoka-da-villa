# 2026-08-27 — Gestão acompanha o catálogo assíncrono

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração.
- Corrigida uma condição de corrida em `assets/operational-sync.js`: a Gestão podia iniciar antes do carregamento assíncrono do catálogo e manter um índice de produtos vazio para perdas/relatórios.
- A sincronização operacional agora resolve o produto pelo catálogo atual e reage ao evento `padoka:catalog-updated`, redesenhando Estoque, Produção, Perdas e o resumo operacional quando o catálogo do servidor chega depois.
- Mantido o comportamento fail-closed: nenhuma informação operacional passa a ser salva localmente e as operações continuam usando `padoka_*`/RPCs já existentes.
- `tests/operational-fail-closed-audit.mjs` ganhou proteção contra o índice congelado e exige a atualização por evento do catálogo.
- Nenhuma migration, RLS, grant, trigger, Edge Function ou dado do Supabase foi alterado nesta execução; portanto não houve mudança de banco que exigisse advisor.
- O backend oficial permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e o projeto InfoTech.io não foi alterado.
