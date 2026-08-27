# 2026-08-27 19:30 — Relatórios revalidam sessão de staff

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `assets/internal-nav.js`, `assets/reporting-sync.js` e `tests/reporting-frontend-audit.mjs` antes da alteração.
- Confirmado que o backend correto continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e nenhuma alteração foi feita no projeto InfoTech.io.
- Identificado que o relatório financeiro era validado apenas na inicialização: em logout ou troca de conta na mesma aba, o painel e o canal Realtime da sessão anterior podiam permanecer montados até recarregar, embora a RPC continuasse protegida no servidor.
- `assets/reporting-sync.js` agora reage a `onAuthStateChange`, limpa imediatamente os dados visuais do relatório, cancela refresh pendente e remove o canal Realtime anterior antes de qualquer reativação.
- A reativação só ocorre depois que o guard global conclui novamente a validação de `padoka_staff_users` e confirma papel `owner` ou `manager` para a mesma identidade autenticada.
- Respostas assíncronas iniciadas pela sessão anterior são invalidadas por epoch e não podem renderizar dados após uma troca de usuário.
- O callback de Auth apenas agenda a revalidação; chamadas assíncronas ao Supabase ficam fora do callback para evitar o padrão de deadlock documentado em `onAuthStateChange`.
- `tests/reporting-frontend-audit.mjs` passou a exigir limpeza de UI, remoção do canal Realtime, invalidação de respostas antigas, confirmação da identidade atual e espera pelo guard de staff.
- Nenhum HTML/CSS, migration, RLS, grant, Edge Function ou objeto não-`padoka_` foi alterado nesta rodada.
