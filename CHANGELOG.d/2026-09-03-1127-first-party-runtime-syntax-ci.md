# 2026-09-03 11:27 — Cobertura de sintaxe dos runtimes próprios

## Alterado

- O workflow `PADOKA Static Audit` deixou de depender de uma lista manual de arquivos JavaScript considerados críticos.
- A etapa de sintaxe agora descobre e valida automaticamente todos os arquivos `assets/*.js` de primeira parte, em ordem determinística.
- `service-worker.js` também passa por `node --check` explicitamente.
- Dependências vendorizadas continuam fora dessa etapa; elas permanecem cobertas pelos controles de integridade e dependências já existentes.

## Segurança / isolamento

- Nenhum runtime funcional, objeto de banco, RLS, policy, grant, trigger, Edge Function ou configuração de autenticação foi alterado.
- O backend da PADOKA permanece fixado no projeto `yncspxfsvlqdnodlsosb`.
- A mudança apenas aumenta a cobertura preventiva do CI para detectar erros de sintaxe em runtimes atuais e futuros antes da publicação.
