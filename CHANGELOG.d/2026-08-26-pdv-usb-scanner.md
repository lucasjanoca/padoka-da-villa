# 2026-08-26 — Leitor físico USB mais robusto no PDV

- Relidos `README.md`, `CHANGELOG.md`, `AUTH_STATUS.md` e o estado atual de `pdv.html` antes da alteração.
- Confirmado que o backend correto continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); nenhum objeto do projeto InfoTech.io foi acessado ou alterado.
- O PDV já aceitava leitores físicos quando o campo de código estava focado. Foi adicionado um caminho global seguro para leitores USB que funcionam como teclado, permitindo bipar mesmo depois de clicar em outra parte não editável da tela.
- A captura global usa intervalo curto entre teclas para diferenciar o fluxo rápido de um scanner de digitação comum, exige um código mínimo antes de aceitar `Enter` e limita o buffer para evitar acumulação inesperada.
- Campos editáveis (`input`, `textarea`, `select` e `contenteditable`) são explicitamente ignorados pela captura global, preservando busca, forma de pagamento e digitação manual.
- A interface agora informa que o modo de leitor USB está ativo sem afirmar que um dispositivo físico específico foi detectado.
- A câmera móvel, o campo manual, o catálogo server-authoritative e a finalização de venda no Supabase foram preservados.
- `tests/static-audit.mjs` ganhou verificações para impedir regressão da captura do leitor USB e da proteção de campos editáveis.
- O advisor de segurança do projeto correto foi consultado. Os avisos `RLS Enabled No Policy` nas tabelas privadas `padoka_payment_attempts`, `padoka_payment_events`, `padoka_payment_settings` e `padoka_product_audit` foram mantidos intencionalmente sem policy de navegador; nenhum grant foi ampliado para silenciar advisor.
- Os avisos sobre funções `SECURITY DEFINER` foram revisados como alertas de superfície exposta, não como indicação automática para remover `SECURITY DEFINER`; nenhuma ACL, RLS ou função foi alterada nesta execução.
- Nenhuma migration ou mudança de banco foi aplicada nesta execução.
