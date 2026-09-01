# 2026-09-01 20:33 — Auditoria acompanha fetch público endurecido

- O `PADOKA Static Audit` mostrou que `tests/runtime-project-isolation-audit.mjs` ainda exigia textualmente a forma antiga do `nativeFetch`, anterior à adição de `redirect = 'error'`.
- A auditoria agora verifica semanticamente que a busca de configuração pública mantém simultaneamente `cache = 'no-store'`, `credentials = 'omit'` e `redirect = 'error'`, sem depender da ordem textual das opções.
- Nenhuma proteção do runtime foi removida e nenhum código de banco, RLS, policy, grant, trigger, Edge Function ou configuração Google foi alterado.
- O backend permanece exclusivamente **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`), sem mudanças no InfoTech.io ou em objetos não-`padoka_`.
