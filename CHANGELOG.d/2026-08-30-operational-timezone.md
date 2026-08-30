## Gestão operacional usa o fuso da padaria

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração.
- `assets/operational-sync.js` agora calcula a data operacional de produção explicitamente em `America/Sao_Paulo`, evitando que um dispositivo com outro fuso carregue ou grave o plano no dia incorreto.
- A mesma função de data continua sendo usada tanto na leitura de `padoka_production_plans` quanto na RPC `padoka_upsert_production_plan`, mantendo consistência entre consulta e gravação.
- Criado `tests/operational-timezone-audit.mjs` para impedir regressão para o fuso local do aparelho.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada; o backend continua exclusivamente em **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e o projeto InfoTech.io permaneceu intocado.
