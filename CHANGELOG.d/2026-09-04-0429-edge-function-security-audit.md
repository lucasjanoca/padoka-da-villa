## 2026-09-04 04:29 — Auditoria de limites das Edge Functions
- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` a partir do HEAD atual antes da alteração.
- Confirmado que o backend correto permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e que o projeto InfoTech.io não deve ser usado pela PADOKA.
- Criado `tests/edge-function-security-audit.mjs` para proteger as Edge Functions `padoka-pix-checkout`, `padoka-public-config`, `padoka-push` e `padoka-telemetry` contra regressões de segurança.
- A auditoria exige allowlist explícita de CORS sem wildcard, dependências `jsr:`/`npm:` com versão fixa, ausência de segredo `sb_secret_`/`service_role` literal e acesso somente a tabelas com prefixo `padoka_`.
- `padoka-pix-checkout` permanece obrigado a validar Bearer/JWT, vincular o pedido ao `user.id`, exigir confirmação real de provedor e falhar fechado enquanto o adapter Pix não estiver implementado.
- `padoka-public-config` continua preso ao project ref `yncspxfsvlqdnodlsosb`, expõe apenas configuração pública/publishable e não pode ler `SUPABASE_SECRET_KEYS` nem `SUPABASE_SERVICE_ROLE_KEY`.
- `padoka-push` continua exigindo JWT para subscribe/unsubscribe e segredo interno comparado em tempo constante para disparo server-to-server.
- `padoka-telemetry` continua bloqueando chamadas sem Origin confiável, redigindo e-mail/telefone e aplicando rate limit.
- Nenhuma migration, RLS, policy, grant, trigger, configuração OAuth, dado comercial ou objeto não-`padoka_` foi alterado nesta execução.
