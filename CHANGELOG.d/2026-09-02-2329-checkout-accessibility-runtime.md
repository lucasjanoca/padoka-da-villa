# Checkout volta a carregar o runtime de acessibilidade

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração, mantendo o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e o projeto InfoTech.io fora do escopo.
- O `PADOKA Static Audit #1285` revelou que `pagamento.html` carregava `assets/accessibility.css`, mas não carregava `assets/accessibility.js`.
- Restaurado `assets/accessibility.js?v=2` no checkout, preservando o skip-link e a região de feedback acessível já padronizados no restante da aplicação.
- A execução seguinte confirmou que a auditoria de acessibilidade passou e revelou um matcher desatualizado em `tests/app-experience-audit.mjs`: ele exigia especificamente `padoka-pwa.js?v=4`, embora o cache-busting do runtime possa avançar sem mudar o contrato da página.
- A auditoria de experiência agora exige a presença de `assets/padoka-pwa.js` e aceita somente um sufixo opcional `?v=<número>`, evitando rebaixar o frontend ou mascarar ausência real do runtime PWA.
- O `PADOKA Static Audit #1289` confirmou os dois pontos acima e avançou até `browser-csp-audit.mjs`, onde encontrou outra premissa antiga: a auditoria exigia `images.unsplash.com` também em páginas sem imagens remotas, como `pagamento.html`.
- A auditoria CSP agora exige essa origem externa somente nas superfícies que realmente renderizam imagens remotas (`index.html`, `produto.html`, `gestao.html` e `pdv.html`), preservando a política de privilégio mínimo nas demais páginas.
- O `PADOKA Static Audit #1291` confirmou a CSP e revelou que `catalog-backend-pinning-audit.mjs` ainda esperava um fetch próprio de `padoka-public-config`, embora o catálogo já tenha sido endurecido para obter a configuração exclusivamente por `PADOKA_RUNTIME.getPublicConfig()` e validá-la antes do uso.
- A auditoria de pinning do catálogo foi alinhada à arquitetura atual: runtime obrigatório, escopo `padoka`, origem HTTPS exata `yncspxfsvlqdnodlsosb.supabase.co`, endpoint `padoka_products` construído somente a partir da origem fixada, `credentials:'omit'`, redirects bloqueados e nenhuma credencial privilegiada no navegador.
- Nenhuma lógica de checkout, catálogo, autenticação, idempotência, pedido, Pix ou Supabase foi alterada.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function ou objeto não-`padoka_` foi alterado nesta execução.
