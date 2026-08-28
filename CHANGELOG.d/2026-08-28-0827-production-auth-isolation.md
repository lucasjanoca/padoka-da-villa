## 2026-08-28 08:27 — Retry de produção isolado por funcionário

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração, mantendo o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e sem tocar no projeto InfoTech.io.
- Identificado que `assets/production-completion.js` persistia tentativas idempotentes em uma chave única de `sessionStorage`; numa troca de conta na mesma aba, o funcionário seguinte poderia herdar o `request_id` e a quantidade pertencentes à identidade anterior.
- O estado pendente de produção passou para `padoka_pending_production_v2` com chave escopada pelo `user_id` do funcionário ativo e cada entrada persiste também seu `userId` proprietário.
- A leitura e a reconciliação com `padoka_production_batches` agora ignoram qualquer tentativa que não pertença à identidade autenticada atual.
- Logout/troca direta de conta remove o retry da identidade anterior antes de reativar o módulo para o novo funcionário; o estado legado não escopado `padoka_pending_production_v1` deixa de ser reutilizado.
- A resposta da RPC `padoka_record_production` também valida `lifecycleEpoch` e o `userId` capturado antes de continuar a UI, impedindo que uma resposta atrasada da sessão anterior seja apresentada como sucesso para a nova conta.
- `tests/production-transaction-audit.mjs` foi ampliado para exigir o isolamento por identidade, reação a `onAuthStateChange` e invalidação de respostas assíncronas antigas.
- Nenhum HTML/CSS, migration, RLS, grant, RPC, secret ou Edge Function implantada foi alterado nesta rodada; portanto não houve necessidade de alterar Security Advisors ou privilégios no banco.
