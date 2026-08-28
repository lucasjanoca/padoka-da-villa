# 2026-08-28 13:28 — Produção preserva retry por funcionário

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração.
- Confirmado o backend correto da PADOKA como **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); nenhum objeto do projeto InfoTech.io foi alterado.
- Identificada regressão em `assets/production-completion.js`: a troca de identidade removia a chave de retry persistida do funcionário anterior, apesar de ela já estar isolada por `user_id`.
- Removida a limpeza destrutiva do retry na troca de conta. Logout/troca de identidade continuam invalidando o runtime, controles, canal Realtime e respostas assíncronas antigas pelo `lifecycleEpoch`, mas preservam a tentativa ambígua do funcionário original.
- Ao retornar, somente a mesma identidade lê sua chave `padoka_pending_production_v2:<user_id>` e reconcilia `request_id`, plano e quantidade contra `padoka_production_batches` antes de limpar a tentativa.
- `tests/production-transaction-audit.mjs` passou a proibir qualquer `clearIdentityPending` e exigir que a troca de identidade limpe somente o runtime.
- `AUTH_STATUS.md` foi atualizado para documentar a garantia.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada nesta execução; por isso não houve mudança de banco que exigisse consulta aos Security Advisors.
