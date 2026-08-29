# 2026-08-29 14:27 — Produção falha fechada em erros de sessão/rede

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` no HEAD atual antes da alteração.
- Confirmado que o backend documentado da PADOKA permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o projeto InfoTech.io não faz parte do runtime PADOKA.
- `assets/production-completion.js` agora centraliza a confirmação de sessão em `confirmedSession()`, capturando tanto erros retornados pelo Supabase Auth quanto rejeições reais de transporte.
- A espera pelo papel interno e a ativação do módulo deixam de prosseguir quando a mesma identidade não pode ser confirmada.
- O probe de `padoka_production_batches` também captura rejeição de rede e mantém o módulo desabilitado em vez de liberar controles sem capability confirmada.
- Depois da RPC idempotente `padoka_record_production`, a identidade (`user_id` + `lifecycleEpoch`) é reconfirmada antes de qualquer feedback, limpeza de retry ou atualização visual; resposta da sessão anterior é descartada.
- O `request_id` pendente continua preservado por funcionário em `sessionStorage`, permitindo retry seguro sem duplicação em respostas ambíguas.
- `tests/production-frontend-audit.mjs` foi ampliado para exigir captura de falha de sessão/transporte, revalidação pós-RPC e probe fail-closed.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada nesta execução; nenhum objeto não-`padoka_` foi tocado.
