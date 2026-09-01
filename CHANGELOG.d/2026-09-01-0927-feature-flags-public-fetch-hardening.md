## 2026-09-01 09:27 — Feature flags públicos isolam credenciais ambiente

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração.
- Confirmado o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) como `ACTIVE_HEALTHY`; o projeto InfoTech.io não foi alterado.
- O Security Advisor foi consultado antes da mudança e não retornou aviso relacionado à PADOKA; avisos `rass_*` e a proteção global de senha permaneceram intocados.
- `assets/feature-flags.js` continua fixando `https://yncspxfsvlqdnodlsosb.supabase.co` e validando `cfg.url` antes de acessar o Data API.
- As requisições públicas de configuração e feature flags agora usam `credentials: 'omit'`, `cache: 'no-store'` e `redirect: 'error'`, evitando envio de credenciais ambiente e falhando fechado em redirecionamento inesperado.
- A consulta continua limitada a `audience=eq.public`, usa somente a chave publicável e mantém comportamento fail-closed: erro de configuração/flags não habilita funcionalidades por padrão.
- Criado `tests/feature-flags-public-fetch-audit.mjs` para impedir regressão do pinning do backend, isolamento de credenciais, escopo público e exposição de segredo administrativo.
- Nenhuma migration, RLS, policy, grant, trigger ou Edge Function foi alterada nesta execução.
