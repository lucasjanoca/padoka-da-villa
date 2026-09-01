# 2026-09-01 17:30 — Configurações internas fixadas ao backend PADOKA

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração; o backend correto permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e o projeto InfoTech.io não foi alterado.
- Identificado que `assets/settings-sync.js` aguardava `window.padokaSupabase` e usava a instância recebida para Auth, RPCs e Realtime sem validar localmente a origem do cliente.
- Adicionado pinning explícito para `https://yncspxfsvlqdnodlsosb.supabase.co` antes de registrar listeners de Auth ou executar qualquer operação de configurações.
- Instâncias apontando para outro projeto agora falham fechadas: os controles permanecem bloqueados e nenhuma leitura/gravação é executada.
- O módulo continua restrito aos papéis `owner` e `manager`, usa somente `padoka_get_settings` e `padoka_update_settings`, e o Realtime permanece limitado a `padoka_settings`.
- Criado `tests/settings-backend-isolation-audit.mjs` para impedir regressão do pinning, garantir a ordem da validação antes de Auth, preservar as RPCs server-authoritative e rejeitar credenciais administrativas no frontend.
- Nenhuma migration, RLS, policy, grant, trigger ou Edge Function foi alterada nesta execução; não houve ampliação de privilégios nem alteração de objetos não-`padoka_`.
