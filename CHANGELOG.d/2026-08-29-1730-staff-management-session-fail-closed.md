# 2026-08-29 17:30 — Gestão de equipe reconfirma owner após operações assíncronas

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` e confirmado que a PADOKA continua usando exclusivamente **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); o projeto InfoTech.io não foi alterado.
- Revisado `assets/staff-management.js`: a aba Equipe permanecia restrita a `owner` e usava RPCs protegidas, porém a confirmação inicial de sessão e respostas de listagem/inclusão/alteração ainda podiam sofrer rejeição real de transporte ou retornar depois de uma troca de identidade.
- Adicionado `safeSession()` para tratar tanto erros retornados pelo Supabase Auth quanto rejeições de rede de `getSession()`.
- Adicionado `identityStillCurrent()` para reconfirmar `user_id` e o papel `owner` antes de aplicar respostas assíncronas, montar a interface ou mostrar sucesso.
- Listagem, probe de inclusão, inclusão por e-mail e alteração de função/estado agora capturam rejeições de transporte sem assumir sucesso. Em falha ambígua, a interface orienta atualização/reconciliação antes de nova tentativa.
- A escrita continua exclusivamente pelas RPCs `padoka_add_staff_by_email` e `padoka_update_staff`; não foi adicionado `insert/update/upsert/delete` direto em `padoka_staff_users`, acesso a `auth.users` no navegador ou criação de conta Auth.
- `tests/staff-management-frontend-audit.mjs` passou a exigir captura de falhas de sessão/transporte, revalidação de identidade/papel e ausência de falso sucesso em falhas ambíguas de rede.
- Nenhuma migration, RLS, grant, RPC, secret ou Edge Function foi alterada nesta execução; portanto não houve ampliação de privilégios nem necessidade de modificar objetos não-`padoka_`.
- Visual, responsividade mobile-first e separação entre clientes e equipe foram preservados.
