## 2026-08-21 02:29 — Conta do cliente endurecida contra conteúdo inesperado

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `conta.html` e a auditoria de onboarding antes da alteração.
- Mantido o backend correto da PADOKA como **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); a conexão Supabase disponível nesta execução continua expondo somente **InfoTech.io**, portanto nenhuma query, migration, advisor ou alteração foi executada nele.
- Identificado que a conta do cliente ainda montava o HTML dos pedidos recentes e o avatar usando valores vindos do perfil/sessão sem uma camada explícita de escape/validação na renderização.
- `conta.html` agora possui `esc()` para conteúdo inserido em templates HTML e `safeAvatarUrl()` para aceitar avatar somente em URL HTTPS válida.
- Nome, e-mail e telefone continuam renderizados com `textContent`; código, status, data, modalidade e total dos pedidos recentes agora são escapados antes de entrarem no HTML.
- O `src` do avatar passa por validação de protocolo e escape do atributo antes de ser renderizado; URL inválida ou não HTTPS cai para a inicial do nome.
- O fluxo Google foi preservado exatamente como estava: tratamento amigável quando o provider está desativado e `prompt=select_account` quando estiver habilitado.
- O onboarding continua exigindo apenas nome, WhatsApp e consentimento de privacidade; aniversário e marketing permanecem opcionais e nenhum endereço/CPF foi adicionado.
- `tests/profile-onboarding-audit.mjs` foi ampliado para impedir regressões na sanitização da conta e na validação HTTPS do avatar.
- O workflow existente já executa `profile-onboarding-audit.mjs`, portanto não foi necessário alterar a CI.
- Nenhuma migration/RLS foi modificada nesta execução; por isso não havia advisor de segurança da PADOKA a executar.
