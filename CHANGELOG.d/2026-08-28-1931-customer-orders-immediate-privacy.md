# Seus pedidos limpa a identidade anterior imediatamente

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração, preservando o backend **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e sem tocar no projeto InfoTech.io.
- Identificado em `acompanhamento.html` que respostas assíncronas antigas já eram invalidadas por `sessionGeneration`, porém a interface do cliente anterior permanecia visível enquanto `removeChannel` aguardava a remoção do Realtime; o `onAuthStateChange` também adiava toda a transição para o próximo task.
- Criado `beginSessionTransition(nextId)`, que no próprio evento de autenticação incrementa a geração, troca a identidade ativa, limpa `itemsByOrder`/`eventsByOrder` e substitui imediatamente a lista anterior por estado de carregamento ou visão desconectada.
- A remoção do canal Realtime continua sendo aguardada antes de carregar a nova identidade; respostas e callbacks da identidade anterior permanecem inválidos pela combinação `activeCustomerId + sessionGeneration`.
- A limpeza imediata também remove do DOM detalhes e QR Pix pertencentes ao cliente anterior, reduzindo exposição visual durante logout/troca de conta em dispositivos compartilhados.
- `acompanhamento.html` continua mobile-first, sem campo de pesquisa, ordenando pedidos mais recentes primeiro, mantendo destaque `Pode vir buscar!`, progresso Recebido→Visto→Confirmado→Preparo→Pronto→Retirado, detalhes expansíveis e Realtime filtrado por `customer_id`.
- `tests/customer-orders-audit.mjs` passou a exigir que a transição visual aconteça antes do `setTimeout` usado para sair com segurança do callback de Auth.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada nesta rodada; por isso não houve mudança de banco nem necessidade de ampliar privilégios.
