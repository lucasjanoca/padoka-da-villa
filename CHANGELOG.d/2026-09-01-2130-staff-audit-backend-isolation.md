# Staff audit backend isolation

- O histórico interno de funcionários (`assets/staff-audit.js`) agora fixa localmente o backend da PADOKA em `https://yncspxfsvlqdnodlsosb.supabase.co` antes de aceitar `window.padokaSupabase`.
- Uma instância Supabase de outro projeto é rejeitada em modo fail-closed antes de qualquer leitura de sessão, listener de Auth ou chamada à RPC `padoka_list_staff_audit`.
- A restrição existente do histórico ao papel `owner`, a revalidação de sessão e o lifecycle de troca/logout permanecem intactos.
- Adicionado `tests/staff-audit-backend-isolation-audit.mjs` para proteger o project pinning, o uso da RPC e a ausência de credenciais administrativas ou referências ao InfoTech no frontend.
- Nenhuma migration, policy, grant, trigger, Edge Function ou objeto não-`padoka_` foi alterado nesta rodada.
