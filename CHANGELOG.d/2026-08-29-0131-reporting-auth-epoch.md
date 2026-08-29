# Relatórios — ativação vinculada ao lifecycle de autenticação

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração, preservando o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e sem tocar no projeto InfoTech.io.
- Identificada uma corrida na inicialização de `assets/reporting-sync.js`: uma troca de funcionário durante `getSession()`/espera do papel poderia deixar uma ativação antiga continuar depois de uma identidade mais nova assumir a sessão.
- A espera por `padokaStaffRole` agora recebe `expectedEpoch` e aborta antes/depois das chamadas assíncronas quando `lifecycleEpoch` muda.
- `activate()` também recebe o epoch esperado e só habilita a interface financeira se epoch, `user_id`, sessão e papel `owner`/`manager` ainda pertencerem à mesma identidade.
- O callback de `onAuthStateChange` captura o epoch criado pela limpeza fail-closed antes de agendar a reativação; inicializações antigas ficam inválidas em trocas consecutivas de conta.
- `start()` agora também captura o epoch antes de `getSession()` e abandona a inicialização se ocorrer mudança de autenticação durante a chamada.
- `tests/reporting-frontend-audit.mjs` foi ampliado para exigir essas garantias e impedir regressão.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada; não houve ampliação de privilégios nem necessidade de mudança nos Security Advisors.
