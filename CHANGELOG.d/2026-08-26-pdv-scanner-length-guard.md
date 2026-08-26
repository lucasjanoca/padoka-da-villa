# 2026-08-26 — Leitor físico rejeita entradas anormalmente longas

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `pdv.html`, `assets/pdv-scanner-fix.js`, `assets/pdv-idempotency.js` e o teste dedicado do leitor antes da alteração.
- Confirmado que o projeto continua no backend **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); nenhuma mudança de banco, RLS ou objeto de outro sistema foi feita nesta execução.
- O leitor USB agora possui limite explícito de 64 caracteres por leitura, evitando crescimento indefinido do buffer em rajadas anormais ou entrada acidental.
- Leituras acima do limite são descartadas por inteiro, sem truncar o valor e sem tentar associá-lo a produto, evitando colisão silenciosa com códigos válidos.
- O campo do leitor também limpa entradas acima do limite e exibe feedback amigável no estado do leitor.
- Enter/Tab, autoenvio para leitores sem sufixo, captura fora do campo, bloqueio durante câmera/venda pendente e catálogo server-authoritative foram preservados.
- O cache-buster de `assets/pdv-scanner-fix.js` foi atualizado para garantir que o GitHub Pages entregue a revisão nova.
- `tests/pdv-hardware-scanner-audit.mjs` ganhou verificações para o limite, descarte integral e versão atual do loader.
- O workflow **PADOKA Static Audit** concluiu com sucesso no commit de testes `834ca7e2cc30f0e33ce77d70f05aa3b858df4261`.
