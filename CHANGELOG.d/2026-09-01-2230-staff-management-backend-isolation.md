# Staff management backend isolation

- A gestão interna de funcionários (`assets/staff-management.js`) agora fixa localmente o backend da PADOKA em `https://yncspxfsvlqdnodlsosb.supabase.co` antes de aceitar `window.padokaSupabase`.
- Uma instância Supabase de outro projeto é rejeitada em modo fail-closed antes de qualquer leitura de sessão, RPC de listagem/inclusão/alteração ou assinatura Realtime da equipe.
- A aba Equipe continua exclusiva de `owner`; listagem, inclusão e alteração permanecem server-authoritative pelas RPCs `padoka_list_staff`, `padoka_add_staff_by_email` e `padoka_update_staff`.
- O fluxo continua sem criar conta Auth, sem criar `padoka_profiles` e sem trigger global em `auth.users`; funcionários permanecem isolados em `padoka_staff_users`.
- Adicionado `tests/staff-management-backend-isolation-audit.mjs` para proteger project pinning, ordem da validação, RPCs `padoka_*`, escopo de Realtime e ausência de credenciais administrativas/InfoTech no frontend.
- Nenhuma migration, policy, grant, trigger, Edge Function ou objeto não-`padoka_` foi alterado nesta rodada.