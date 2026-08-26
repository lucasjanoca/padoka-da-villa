# 2026-08-26 — Feedback visual do leitor físico no PDV

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md`, `pdv.html`, `assets/pdv-idempotency.js`, `assets/pdv-scanner-fix.js` e o teste dedicado do leitor antes de concluir a alteração.
- Confirmado que o backend correto continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); nenhum objeto do projeto InfoTech.io foi acessado ou alterado.
- A revisão identificou que a captura robusta de leitores USB já existia em `assets/pdv-scanner-fix.js`: Enter/Tab, autoenvio sem sufixo, rajadas rápidas fora do campo principal, proteção durante câmera/venda pendente e consulta de códigos no backend.
- Uma tentativa inicial de repetir parte dessa captura dentro de `pdv.html` foi removida antes da conclusão para evitar dois listeners concorrentes e dupla inclusão de itens.
- `pdv.html` ganhou somente a camada visual do estado do leitor físico, sem afirmar que um dispositivo específico foi detectado pelo navegador.
- `assets/pdv-scanner-fix.js` agora atualiza esse estado quando o modo USB fica pronto e depois de cada código recebido, informando se o produto foi reconhecido ou se o código ainda não está cadastrado.
- A implementação consolidada continua usando a extensão existente como única fonte de verdade para captura física; o teste dedicado `tests/pdv-hardware-scanner-audit.mjs` permanece responsável pelas invariantes de Enter/Tab, autoenvio, rajada rápida e bloqueio durante venda/câmera.
- A câmera móvel, a digitação manual, o catálogo server-authoritative e a finalização idempotente de venda no Supabase foram preservados.
- O advisor de segurança do projeto correto foi consultado. Os avisos `RLS Enabled No Policy` nas tabelas privadas `padoka_payment_attempts`, `padoka_payment_events`, `padoka_payment_settings` e `padoka_product_audit` foram mantidos intencionalmente sem policy de navegador; nenhum grant foi ampliado para silenciar advisor.
- Os avisos sobre funções `SECURITY DEFINER` foram tratados como alertas de superfície exposta, não como indicação automática para remover proteção; nenhuma ACL, RLS ou função foi alterada nesta execução.
- Nenhuma migration ou mudança de banco foi aplicada nesta execução.
