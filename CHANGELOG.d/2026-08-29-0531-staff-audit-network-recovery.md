# 2026-08-29 05:31 — Histórico da equipe recupera falhas de transporte

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração, preservando o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e o isolamento `padoka_*`.
- Revisado o estado atual da Gestão e identificado que `assets/staff-audit.js` já restringia o histórico ao papel `owner`, validava `user_id` + `lifecycleEpoch` e usava somente a RPC server-authoritative `padoka_list_staff_audit`, mas não capturava rejeições reais de transporte nas chamadas de listagem/probe.
- `load()` agora captura rejeição de rede, revalida a identidade/epoch antes de tocar a interface, libera novamente o botão **Atualizar** e mostra uma mensagem amigável para nova tentativa, em vez de deixar o controle preso em **Atualizando…**.
- `probe()` agora também captura rejeições de transporte e mantém a capability indisponível em modo fail-closed quando o servidor não pode ser confirmado; nenhuma permissão é ampliada como fallback.
- `tests/staff-management-audit.mjs` passou a exigir captura explícita de falhas de transporte, revalidação do lifecycle e recuperação do botão/mensagem do histórico.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada nesta execução; não houve motivo para alterar Security Advisors ou privilégios do banco.
- Nenhum objeto não-`padoka_` e nenhum recurso do projeto InfoTech.io foi alterado.