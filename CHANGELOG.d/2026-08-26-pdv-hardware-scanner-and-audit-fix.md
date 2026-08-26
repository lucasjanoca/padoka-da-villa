# PDV: leitor físico e auditoria geral

- Corrigida a cadeia de migrations para eliminar numerações duplicadas sem reordenar migrations já existentes.
- O teste da cadeia agora acompanha automaticamente novas migrations e exige sequência contínua sem duplicatas.
- Removido um `grant select` redundante da migration de gestão de catálogo; a leitura pública continua definida exclusivamente na migration 002 e protegida por RLS.
- O PDV passou a aceitar leitores físicos em modo teclado com sufixo Enter ou Tab.
- Leitores sem sufixo também são reconhecidos por rajadas rápidas de teclas, com proteção para não interpretar digitação humana lenta como bipagem.
- A leitura física funciona mesmo se o foco estiver em botão/forma de pagamento, sem interferir com campos de texto onde o operador esteja digitando.
- Adicionado teste automatizado específico para compatibilidade com leitor físico e verificação de sintaxe das extensões do PDV no CI.
