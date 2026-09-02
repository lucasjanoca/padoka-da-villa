# 2026-09-02 03:27 — Feature flags passam a depender somente do runtime endurecido

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração e confirmado o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`).
- `assets/feature-flags.js` deixou de manter fallback próprio para `padoka-public-config`; se `PADOKA_RUNTIME.getPublicConfig()` não estiver disponível, o módulo falha fechado e mantém as funcionalidades opcionais desativadas.
- A configuração é revalidada antes da consulta REST: `scope` precisa ser `padoka`, a URL precisa apontar exatamente para a raiz `https://yncspxfsvlqdnodlsosb.supabase.co` e a chave precisa ser publishable moderna ou JWT público legado com `role=anon`.
- A resposta de `padoka_feature_flags` agora também exige `Content-Type: application/json` antes do parse, mantendo `cache: no-store`, `credentials: omit`, `redirect: error` e filtro `audience=eq.public`.
- Criado `tests/feature-flags-runtime-config-audit.mjs` para impedir regressão do project pinning, fallback próprio, escopo PADOKA, validação de chave, audiência pública e credenciais administrativas no frontend.
- O primeiro `PADOKA Static Audit` identificou uma expectativa antiga em `tests/backend-isolation-audit.mjs`, que exigia literalmente o helper removido `requirePadokaOrigin(cfg.url)`; o teste foi atualizado para exigir o novo contrato mais forte `validateConfig(...)`, incluindo escopo, raiz exata e origem já validada antes da consulta REST.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function ou configuração de Auth/Google foi alterada nesta execução; o projeto InfoTech.io permaneceu intocado.
