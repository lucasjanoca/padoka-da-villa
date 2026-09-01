# 2026-09-01 13:28 — PADOKA Club deixa de inventar benefícios quando falta configuração

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração.
- Confirmado que o backend correto continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o frontend do Club já fixa explicitamente esse project ref.
- Identificado que `assets/club.js` usava uma configuração local de benefícios (`1 pt/R$`, bônus inicial e multiplicador de aniversário) quando `padoka_loyalty_settings` não retornava linha.
- Esse fallback não alterava saldo no servidor, mas podia exibir ao cliente uma regra de fidelidade que não estava realmente configurada no banco.
- O Club agora falha fechado quando `padoka_loyalty_settings` não está disponível: a área de conteúdo não é liberada e a mensagem amigável de indisponibilidade permanece na tela.
- Removidos também defaults visuais positivos em `renderSummary`; benefícios exibidos passam a depender exclusivamente da configuração recebida do backend.
- Resgates e cancelamentos continuam server-authoritative pelas RPCs `padoka_redeem_reward` e `padoka_cancel_loyalty_redemption`.
- Criada `tests/club-settings-fail-closed-audit.mjs` para impedir regressão para benefícios inventados no navegador e preservar o project ref correto e a ausência de credenciais administrativas no frontend.
- Nenhuma migration, RLS, policy, grant, trigger ou Edge Function foi alterada nesta execução; nenhum objeto não-`padoka_` e nenhum recurso do InfoTech.io foi tocado.
