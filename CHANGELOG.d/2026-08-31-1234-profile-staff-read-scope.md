# 2026-08-31 12:34 — Leitura de perfis de clientes reduzida para staff não-gerencial

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração.
- Confirmado que o backend correto continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`), em estado `ACTIVE_HEALTHY`; o projeto InfoTech.io não foi alterado.
- Identificado que a policy `padoka_profiles_read_authorized` permitia que qualquer funcionário PADOKA ativo lesse todos os perfis de clientes, embora a fila de pedidos solicite somente os perfis associados aos pedidos já visíveis para a identidade interna.
- Criada e aplicada a migration `070_profile_staff_read_scope.sql`.
- O cliente continua lendo somente o próprio perfil PADOKA (`auth.uid()` + `app_scope='padoka'`).
- `owner` e `manager` mantêm leitura administrativa dos perfis para atendimento e gestão.
- Staff não-gerencial agora só consegue ler um perfil quando existe pedido daquele cliente dentro da fronteira operacional vigente; quando o Pix gate está ativo, isso exige pedido pago, alinhando a exposição do perfil à visibilidade operacional do pedido.
- RLS permaneceu ativa em `padoka_profiles`; `anon` continua sem `SELECT` e `authenticated` continua sem `DELETE`. Nenhum grant foi ampliado.
- Adicionada `tests/profile-staff-read-scope-audit.mjs` para impedir regressão para leitura irrestrita de perfis por qualquer staff e garantir que `pedidos.html` continue requisitando apenas clientes presentes na fila carregada.
- Security Advisor executado antes e depois: nenhum alerta relacionado à PADOKA foi introduzido. Permanecem apenas avisos de objetos `rass_*` e a configuração global de leaked password protection, que não foram alterados.
- Nenhum trigger em `auth.users`, objeto não-`padoka_`, credencial Google, secret ou Edge Function foi alterado.
