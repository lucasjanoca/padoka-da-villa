# 2026-08-28 16:26 — Relatórios usam o fuso operacional da padaria

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, o estado atual do repositório e a CI antes da alteração.
- Confirmado que o backend correto permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e nenhuma mudança foi feita no projeto InfoTech.io.
- Identificado que `assets/reporting-sync.js` informava “horário da padaria: São Paulo”, porém calculava o dia atual com o timezone local do dispositivo.
- O relatório agora calcula o dia operacional explicitamente em `America/Sao_Paulo` usando `Intl.DateTimeFormat(...).formatToParts()`, evitando deslocamento de data perto da meia-noite em dispositivos configurados em outro fuso.
- O mesmo dia de São Paulo continua sendo usado para preencher o período padrão e para decidir quando o Realtime deve atualizar automaticamente um relatório que termina em hoje.
- `tests/reporting-frontend-audit.mjs` passou a exigir o timezone explícito e impedir regressão para cálculo dependente do dispositivo.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada nesta rodada; não houve necessidade de ampliar privilégios nem consultar advisors de banco.
