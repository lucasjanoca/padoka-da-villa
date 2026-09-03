## 2026-09-03 14:28 — Onboarding mínimo protegido pelo CI

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `conta.html`, `assets/account.js`, `supabase/013_customer_profile_rpc.sql` e `tests/profile-onboarding-audit.mjs` antes da alteração.
- Confirmado que o backend permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que esta rodada não altera banco, RLS, grants, OAuth ou qualquer objeto do projeto InfoTech.io.
- `tests/profile-onboarding-audit.mjs` agora protege explicitamente o contrato de minimização de dados do primeiro acesso: nome e telefone/WhatsApp permanecem no cadastro; consentimento de privacidade continua explícito; aniversário e marketing continuam opcionais.
- A auditoria falha se CPF/documento fiscal ou endereço/CEP forem adicionados ao onboarding padrão ou aos argumentos da RPC `padoka_save_profile`.
- Também ficou protegido que nome e e-mail continuam pré-preenchidos pela identidade autenticada, que o nome permanece editável e que o e-mail autenticado fica somente leitura na tela de primeiro acesso.
- Nenhuma mudança funcional, visual ou de banco foi necessária; a melhoria é uma barreira de regressão para preservar as regras atuais com segurança.
