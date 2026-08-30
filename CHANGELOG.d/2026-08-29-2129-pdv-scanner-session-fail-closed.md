# 2026-08-29 21:29 — Leitor do PDV falha fechado em erros de sessão/rede

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, o estado atual do repositório e os módulos do PDV antes da alteração.
- O backend correto permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); o projeto InfoTech.io não foi alterado.
- `assets/pdv-scanner-fix.js` agora centraliza `auth.getSession()` em `safeSession()`, capturando tanto erros retornados pelo Supabase Auth quanto rejeições reais de transporte.
- A atualização de códigos por `padoka_list_product_barcodes`, a ativação da capability `pdv` e o bootstrap do leitor permanecem fail-closed quando a sessão do funcionário não pode ser confirmada.
- Logout/troca de conta continuam invalidando `scannerLifecycleEpoch`, limpando códigos/buffers locais e impedindo que respostas atrasadas da identidade anterior sejam aplicadas.
- A reativação assíncrona disparada por `onAuthStateChange` agora captura rejeições inesperadas e volta a bloquear o leitor com mensagem amigável.
- `assets/pdv-idempotency.js` recebeu somente a nova revisão de cache do scanner (`v=2026082921`) para que o GitHub Pages não reutilize a versão antiga do arquivo.
- `tests/pdv-hardware-scanner-audit.mjs` passou a exigir o helper de sessão fail-closed, seu uso nos pontos sensíveis e o cache-buster atualizado.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada nesta execução; nenhum objeto não-`padoka_` foi tocado.
