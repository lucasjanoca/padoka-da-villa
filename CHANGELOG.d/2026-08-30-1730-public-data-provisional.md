## 2026-08-30 17:30 — Dados públicos não confirmados ficam identificados como provisórios
- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração, mantendo o backend exclusivamente em **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e sem tocar o projeto InfoTech.io.
- Identificado que a home ainda exibia horário, endereço e campanha com valores específicos sem deixar claro, nessa mesma área, que esses dados operacionais podem continuar demonstrativos enquanto não houver validação oficial da padaria.
- `assets/catalog.js` agora adiciona uma nota discreta e mobile-first junto aos cards públicos informando que funcionamento, endereço e campanhas podem ser demonstrativos até confirmação oficial.
- O aviso não altera checkout, catálogo autoritativo, preços, autenticação, acompanhamento, área interna ou regras de banco.
- `tests/static-audit.mjs` agora impede regressão exigindo a identificação desses dados públicos não confirmados e a semântica `role="note"`.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada; portanto não houve ampliação de acesso nem necessidade de mudança nos Security Advisors do banco.
