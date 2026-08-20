## 2026-08-20 01:31 — Relatórios operacionais sincronizados
- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração.
- Mantido o backend correto da PADOKA como **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e confirmado que o conector Supabase disponível nesta execução expõe somente **InfoTech.io**; nenhuma query ou alteração foi executada nele.
- `assets/operational-sync.js` passou a enriquecer a aba Relatórios quando a camada operacional da migration 003 estiver ativa, sem alterar o comportamento seguro de fallback enquanto as tabelas ainda não existirem.
- Os indicadores sincronizados agora mostram catálogo, itens com estoque baixo, quantidade perdida e produtos com código/EAN.
- Adicionado resumo diário com produção planejada, produzido, itens com saldo e produtos sem código.
- Adicionadas tabelas de estoque que pede atenção e perdas recentes, usando apenas dados já permitidos ao staff autenticado pelas políticas preparadas da camada operacional.
- Nenhum link interno foi exposto ao cliente público e nenhuma permissão/RLS foi ampliada.
- Nenhuma migration ou RLS foi aplicada nesta execução; portanto não houve advisor do backend PADOKA para executar.
- Registro mantido como fragmento em `CHANGELOG.d/` porque o conector de atualização de arquivos exige substituição integral do `CHANGELOG.md`; o fragmento evita reescrever ou truncar o histórico existente e pode ser incorporado ao arquivo principal em uma rodada segura posterior.
