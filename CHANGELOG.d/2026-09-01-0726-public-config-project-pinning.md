## 2026-09-01 07:26 — Configuração pública presa ao projeto PADOKA
- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração; o backend correto permanece **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e o projeto InfoTech.io não foi alterado.
- Identificado que `padoka-public-config` ainda consumia `SUPABASE_URL` diretamente do ambiente antes de devolver a configuração pública e consultar `/auth/v1/settings`.
- A Edge Function agora fixa `https://yncspxfsvlqdnodlsosb.supabase.co` como origem PADOKA e só aceita `SUPABASE_URL` quando a origem e o caminho correspondem exatamente a esse projeto; configuração inesperada falha fechada com `config_unavailable`.
- O comportamento existente de CORS restrito, `cache-control: no-store`, leitura de chave publicável e detecção amigável do provider Google foi preservado; nenhuma credencial Google foi inventada.
- A função continua `verify_jwt=false` porque é o endpoint público de bootstrap e já operava assim; nenhuma função sensível autenticada teve JWT desativado.
- A versão 6 de `padoka-public-config` foi implantada no projeto `yncspxfsvlqdnodlsosb` e confirmada como `ACTIVE` com o código pinado.
- Criada `tests/public-config-project-isolation-audit.mjs` para impedir regressão para uso não validado de `SUPABASE_URL`.
- Nenhuma migration, RLS, policy, grant, trigger ou objeto não-`padoka_` foi alterado nesta execução.
