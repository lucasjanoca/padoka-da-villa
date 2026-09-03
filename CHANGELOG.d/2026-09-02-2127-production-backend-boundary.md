# Produção: auditoria da fronteira de backend

- Adiciona `tests/production-backend-boundary-audit.mjs` para proteger o módulo interno de produção contra regressões de isolamento.
- A auditoria exige o project ref PADOKA `yncspxfsvlqdnodlsosb` na configuração/CSP da gestão e confirma que `internal-nav.js` rejeita qualquer origin Supabase diferente.
- Protege o carregamento de `production-completion.js` somente após autorização interna e mantém os papéis mínimos `owner`, `manager` e `production`.
- Confirma sessão imediatamente antes da RPC server-authoritative `padoka_record_production`, namespace de retry por funcionário e limpeza do Realtime/lifecycle na troca de identidade.
- Bloqueia credenciais privilegiadas no frontend, objetos não `padoka_`, escrita direta de estoque e dependência do runtime InfoTech.io.

Nenhuma migration, policy RLS, grant, trigger, Edge Function ou configuração de OAuth foi alterada nesta execução.
