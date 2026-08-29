# 2026-08-29 06:26 — Retirada não aceita mais o minuto atual

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração; o backend correto permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e nenhum recurso do InfoTech.io foi alterado.
- Revisado `assets/pickup-validation.js` e confirmado que a validação pública já usa `America/Sao_Paulo`, impede datas passadas e deixa as regras operacionais/horários comerciais para o backend.
- Corrigido um desalinhamento de borda: no mesmo dia, o navegador aceitava exatamente o minuto atual (`HH:MM`), embora no momento do envio o timestamp autoritativo do servidor já possa estar alguns segundos à frente e rejeitar a retirada como passada.
- O frontend agora rejeita horários de retirada no mesmo dia quando o horário escolhido é **menor ou igual ao minuto atual**, evitando uma tentativa que o backend autoritativo pode recusar segundos depois.
- `tests/pickup-validation-audit.mjs` foi atualizado para exigir esse comportamento e continua garantindo que nenhuma faixa de horário comercial seja inventada no cliente.
- `node --check` passou para o arquivo de runtime modificado. A clonagem local completa continuou indisponível por falha de DNS do ambiente, portanto a suíte integral fica a cargo do `PADOKA Static Audit` disparado pelos commits.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada; não houve ampliação de acesso nem necessidade de modificar objetos não-`padoka_`.
