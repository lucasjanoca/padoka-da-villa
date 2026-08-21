# 2026-08-21 06:28 — Retirada pública bloqueia data/horário passados antes do checkout

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração e revisado o estado atual do checkout/migration 011.
- Identificado que a migration 011 já rejeita data ou horário de retirada no passado usando `America/Sao_Paulo`, porém o formulário público ainda permitia selecionar esses valores e só descobrir o erro no servidor depois.
- Criado `assets/pickup-validation.js`, carregado somente quando a página contém o modal público de retirada.
- O campo de data agora recebe como mínimo o dia atual no fuso da padaria e data anterior é bloqueada antes de continuar.
- Quando a retirada é para o próprio dia, horário já passado também é bloqueado antes do checkout.
- A validação usa `setCustomValidity`, mostra feedback simples e impede que uma seleção inválida chegue ao handler existente de continuidade.
- A referência temporal é atualizada quando a página volta do background ou recebe foco, evitando deixar um dia antigo válido em celular que ficou com a aba aberta.
- O guard não replica nem inventa horários de funcionamento/Padoca Noturna; as regras provisórias existentes continuam separadas e a validação nova trata apenas passado versus futuro.
- A proteção autoritativa da migration `011_checkout_order_idempotency.sql` foi preservada; a checagem no navegador é apenas UX/defesa adicional e não substitui validação do servidor.
- Criado `tests/pickup-validation-audit.mjs` e incluído no workflow `.github/workflows/padoka-audit.yml` para proteger fuso, data mínima, horário passado, carregamento restrito ao fluxo público e ausência de horários comerciais inventados no guard.
- A conexão Supabase disponível nesta execução continua expondo somente **InfoTech.io**; nenhuma migration, query, advisor ou alteração foi executada nele. O backend correto permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`).
- O ambiente local continua sem resolução DNS para `github.com`, então a suíte não pôde ser clonada/rodada fora do CI nesta execução; o novo teste e os arquivos alterados foram revisados diretamente no repositório.
