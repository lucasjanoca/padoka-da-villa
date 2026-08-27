# 2026-08-27 — Área interna reage a logout e troca de conta

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `assets/internal-nav.js` e a auditoria de navegação interna antes da alteração.
- Confirmado que o backend correto continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e está `ACTIVE_HEALTHY`; nenhum projeto InfoTech.io foi acessado ou alterado.
- `assets/internal-nav.js` agora escuta `onAuthStateChange` e invalida imediatamente o papel/permissões resolvidos quando a sessão interna encerra ou troca de usuário em outra aba.
- Antes de aplicar um papel de `padoka_staff_users`, a navegação revalida que a mesma conta continua autenticada após a consulta; respostas assíncronas antigas são descartadas por um contador de geração (`staffValidationEpoch`).
- Em logout, a área interna volta para `internal.html`; em troca de conta, as permissões são limpas e resolvidas novamente a partir do cadastro real `padoka_staff_users` da nova sessão.
- A revalidação acionada pelo evento Auth é adiada para fora do callback, evitando executar consultas assíncronas dentro do listener.
- O visual, a navegação permitida por função e todos os módulos públicos foram preservados; nenhuma área de Caixa, Estoque, Produção ou Administração foi exposta ao cliente.
- `tests/staff-navigation-audit.mjs` foi ampliado para impedir regressão do lifecycle de sessão, da limpeza de permissões antigas e da checagem da identidade após consultas assíncronas.
- A auditoria completa `PADOKA Static Audit` #286 terminou com sucesso no commit de teste.
- Os Security Advisors do projeto correto foram consultados. Avisos de `padoka_payment_*` e `padoka_product_audit` com RLS sem policy continuam informativos por desenho quando não há acesso direto de navegador; avisos de RPCs `SECURITY DEFINER` não foram tratados removendo proteção ou ampliando grants, pois esta mudança não alterou banco/RLS. Objetos não-`padoka_*` não foram alterados.
- Nenhuma DDL, migration, grant, policy ou Edge Function foi alterada nesta execução.
