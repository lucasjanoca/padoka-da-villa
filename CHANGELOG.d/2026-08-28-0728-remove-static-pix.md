# 2026-08-28 07:28 — Pix estático removido do checkout público

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `pagamento.html`, `assets/order-idempotency.js`, `assets/pix-static.js` e `tests/checkout-rendering-audit.mjs` antes da alteração.
- Confirmado que o backend correto permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que nenhuma alteração foi feita no projeto InfoTech.io.
- Identificado que, apesar do checkout já estar fail-closed aguardando Pix automático real, `pagamento.html` ainda carregava `assets/pix-static.js` e `assets/qrcode.min.js`, mantendo no navegador um fluxo Pix manual que não deve mais fazer parte da operação.
- `pagamento.html` deixou de carregar o gerador/QR estático e não monta mais chave, payload ou botões de cópia de Pix no navegador.
- O cartão de pagamento agora mostra apenas o estado **Pix automático em configuração**, mantendo o checkout bloqueado até cobrança dinâmica e confirmação autenticada de um provedor real estarem disponíveis.
- `assets/pix-static.js` foi removido do estado atual do repositório, eliminando a chave Pix embutida no JavaScript público. A remoção do arquivo atual não apaga histórico Git; qualquer chave anteriormente publicada deve ser tratada como pública caso venha a ser reutilizada fora deste protótipo.
- `tests/checkout-rendering-audit.mjs` agora falha se `pagamento.html` voltar a carregar `pix-static.js`, `qrcode.min.js`, `PADOKA_PIX`, oferecer `PIX MANUAL` ou deixar de sinalizar o estado fail-closed do Pix automático.
- Não houve migration, mudança de RLS, grant, RPC, Edge Function implantada ou secret nesta rodada; portanto não houve alteração de banco nem ampliação de privilégios.
- Nenhum objeto fora do namespace `padoka_` foi alterado.
