# 2026-08-26 — Sincronizações sensíveis respeitam o papel antes de consultar o backend

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração, mantendo como backend exclusivo da PADOKA o projeto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`).
- `assets/reporting-sync.js` agora espera o papel interno já validado em `window.padokaStaffRole` e só inicializa o relatório financeiro consolidado para `owner` ou `manager`.
- Funcionários de outros papéis deixam de disparar chamadas desnecessárias para `padoka_report_summary` ao abrir outras áreas da Gestão.
- `assets/settings-sync.js` recebeu a mesma proteção: sincronização/leitura de configurações só começa para `owner` ou `manager`, preservando o bloqueio fail-closed quando o servidor estiver indisponível.
- A autorização real continua sendo obrigatoriamente validada no backend; o filtro do frontend é defesa adicional e redução de exposição, não substituto para RLS/RPC.
- `tests/static-audit.mjs` ganhou verificações para impedir regressão dessa allowlist e exigir que ambos os módulos esperem o papel interno antes de iniciar.
- O advisor de segurança do projeto PADOKA foi consultado antes desta alteração. Os avisos existentes de `SECURITY DEFINER` foram revisados como avisos que exigem autorização interna explícita; nenhum grant foi ampliado e nenhum objeto de outro sistema foi alterado para limpar alertas do projeto compartilhado.
- Não houve DDL, migration, mudança de RLS ou alteração de dados nesta execução; o projeto **InfoTech.io** não foi acessado nem alterado.
