## 2026-09-03 06:28 — Lifecycle de papéis operacionais protegido por auditoria

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` e confirmado o HEAD anterior `64d9a42ae65a0c15a3d6f32945deb57d5669410b`.
- Confirmado novamente que o backend correto da PADOKA é **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); nenhuma alteração foi feita no projeto InfoTech.io.
- O `PADOKA Static Audit #1316` e o `PADOKA CodeQL #474` do HEAD anterior estavam concluídos com sucesso antes desta mudança.
- Criada `tests/operational-role-lifecycle-audit.mjs` para impedir regressões no isolamento dos módulos Estoque, Produção, Perdas e Relatórios durante login, logout e troca de funcionário.
- A auditoria fixa as allowlists mínimas de papéis por módulo, exige validação de `padoka_staff_users` e autorização do papel antes do carregamento dos scripts internos, exige fail-closed para staff inativo e protege a limpeza imediata de `padokaStaffRole`/capabilities na troca de sessão.
- O teste também exige que o runtime operacional aguarde os estados `padoka-staff-pending`/`padoka-role-pending`, confirme que a sessão ainda pertence ao mesmo `user_id`, limpe dados operacionais e remova o canal Realtime quando a identidade muda.
- Foram adicionadas proibições explícitas contra `service_role`, `sb_secret_` e referência a `auth.users` no runtime interno auditado.
- A sintaxe do novo teste foi validada com `node --check` antes do commit.
- Nenhuma migration, RLS, policy, grant, trigger, Edge Function, configuração Google OAuth ou objeto não-`padoka_` foi alterado nesta execução.
