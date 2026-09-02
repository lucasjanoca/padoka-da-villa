## 2026-09-02 00:27 — MFA passa a depender do runtime público endurecido
- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração, preservando o backend **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e o isolamento `padoka_*`.
- `mfa.html` passou a carregar `assets/app-runtime.js` antes de `assets/mfa.js`.
- `assets/mfa.js` não mantém mais um `fetch` próprio para `padoka-public-config`; a tela administrativa falha fechada se `PADOKA_RUNTIME.getPublicConfig()` não estiver disponível.
- A validação local de defesa em profundidade exige `scope = padoka`, URL raiz exata `https://yncspxfsvlqdnodlsosb.supabase.co` e chave pública em formato publishable ou JWT legado com `role = anon`.
- A configuração é validada antes de criar o cliente Supabase e antes de qualquer leitura de sessão, consulta a `padoka_staff_users` ou operação MFA.
- As restrições existentes foram preservadas: somente `owner`/`manager` entram no fluxo AAL2, retorno permanece limitado às páginas internas autorizadas e nenhuma credencial administrativa foi adicionada ao frontend.
- Criada `tests/mfa-runtime-config-audit.mjs` para impedir regressão do fallback próprio, project pinning, escopo PADOKA, formatos públicos de chave e separação de staff.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function, configuração Google ou objeto não-`padoka_` foi alterado nesta execução; o projeto InfoTech.io permaneceu intocado.
