# 2026-08-20 07:27 — Catálogo autoritativo endurecido antes de novas integrações

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração.
- Mantido o backend correto da PADOKA como **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); nenhum objeto do projeto InfoTech.io foi alterado.
- `assets/catalog.js` agora valida `product_id` vindo do servidor contra um formato seguro antes de disponibilizá-lo às telas que usam atributos `data-*` e seletores.
- Nome e categoria recebidos de `padoka_products` passam por escape de HTML antes de chegar aos templates compartilhados pelo cardápio, carrinho, PDV e Gestão.
- Preços continuam sendo lidos do servidor, mas valores negativos são rejeitados também no frontend como defesa adicional; o banco continua sendo a autoridade real.
- Metadados visuais locais permanecem limitados a foto, descrição, unidade e tag; nenhuma volta a preços estáticos foi introduzida.
- `tests/static-audit.mjs` ganhou verificações para impedir regressão da validação de ID, escape de nome/categoria e rejeição de preço negativo.
- A tentativa de executar a auditoria completa localmente continuou bloqueada por DNS para `github.com`; o conector GitHub confirmou os arquivos gravados, mas não apresentou workflow/status remoto para o commit nesta execução. Não foi afirmado sucesso de CI sem evidência.
- Nenhuma migration/RLS foi alterada nesta execução, portanto não havia advisor de segurança da PADOKA a executar.
