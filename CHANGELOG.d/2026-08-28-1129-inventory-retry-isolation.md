# 2026-08-28 11:29 — Retry de ajuste de estoque isolado por funcionário

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração e confirmado o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`).
- Identificado que `assets/operational-sync.js` ainda persistia ajustes ambíguos sob a chave global `padoka_pending_inventory_adjustment_v1` e removia essa tentativa quando a identidade do staff mudava.
- O retry de `padoka_adjust_inventory_once` agora usa `padoka_pending_inventory_adjustment_v2:<user_id>` e grava também o `user_id` dentro do payload persistido.
- Leitura, reconciliação, limpeza e reutilização do `request_id` exigem a mesma identidade autenticada que originou a tentativa.
- Logout/troca de conta continua invalidando o estado operacional em memória, o canal Realtime e respostas assíncronas antigas, mas não apaga o retry pertencente à conta anterior.
- A chave global legada é descartada no início do módulo para evitar herança de uma tentativa sem proprietário confiável.
- `tests/operational-inventory-audit.mjs` foi ampliado para exigir chave por identidade, validação do proprietário, descarte da chave legada e ausência da limpeza global anterior.
- `AUTH_STATUS.md` foi atualizado com o comportamento de isolamento do retry de estoque.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function implantada foi alterada nesta execução; por isso não houve mudança de banco nem necessidade de ampliar permissões.
- Nenhum objeto não-`padoka_` e nenhum recurso do projeto InfoTech.io foram alterados.
