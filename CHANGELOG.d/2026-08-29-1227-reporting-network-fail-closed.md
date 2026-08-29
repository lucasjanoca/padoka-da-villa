# 2026-08-29 12:27 — Relatórios passam a falhar fechados em erros de transporte

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `assets/reporting-sync.js`, `tests/reporting-frontend-audit.mjs` e o workflow de auditoria antes da alteração.
- Confirmado que o backend documentado da PADOKA continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o projeto InfoTech.io não deve ser usado pela PADOKA.
- Identificado que o frontend de relatórios já restringia a ativação a `owner`/`manager`, usava `padoka_report_summary` e invalidava respostas antigas por `lifecycleEpoch`, porém rejeições reais de transporte em `sb.rpc(...)` ou `auth.getSession()` ainda podiam escapar dos `await`.
- `assets/reporting-sync.js` agora captura rejeições de transporte da RPC e do Auth, recupera o botão de atualização com mensagem amigável quando a identidade ainda é a mesma e mantém a ativação em modo fail-closed quando a sessão não pode ser confirmada.
- A resposta financeira retornada por `padoka_report_summary` passou a reconfirmar `user_id + lifecycleEpoch` antes de renderizar os dados e antes de assinar o canal Realtime.
- `waitForRole`, `activate` e a inicialização reutilizam a confirmação de sessão fail-closed; troca/logout continuam limpando a UI e o canal da identidade anterior.
- `tests/reporting-frontend-audit.mjs` foi ampliado para exigir captura explícita de rejeições de transporte, reconfirmação de identidade após a RPC e bloqueio da renderização/Realtime sem sessão válida.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada nesta execução. Nenhum objeto não-`padoka_` foi tocado.
