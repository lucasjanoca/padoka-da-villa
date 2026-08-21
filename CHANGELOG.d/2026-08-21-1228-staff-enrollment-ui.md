# 2026-08-21 12:28 — Inclusão segura de funcionário integrada à aba Equipe

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração.
- Revisadas as migrations `014_staff_management_rpc.sql` e `015_staff_enrollment_rpc.sql`, preservando o backend alvo exclusivo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`) e o isolamento `padoka_*`.
- Confirmado pelo conector Supabase que a conexão disponível continua expondo somente **InfoTech.io**; nenhuma query, migration, advisor ou alteração foi executada nele.
- `assets/staff-management.js` agora detecta de forma segura a existência da RPC `padoka_add_staff_by_email` usando uma chamada inválida e sem efeito (`p_email=''`). A ausência da migration 015 apenas oculta o formulário, sem quebrar a aba Equipe já fornecida pela migration 014.
- Quando a 015 estiver disponível, somente `owner` vê o formulário para associar à equipe uma conta Auth que já exista, escolhendo a função interna. A tela não cria usuário Auth, senha ou `padoka_profiles` e não consulta `auth.users` diretamente.
- Foram adicionadas mensagens amigáveis para conta inexistente, usuário já pertencente à equipe, e-mail inválido e falta de permissão; em sucesso, a lista interna é recarregada pela RPC protegida.
- O layout da inclusão é responsivo/mobile-first e mantém a proteção visual contra o owner remover o próprio acesso.
- `tests/staff-management-frontend-audit.mjs` foi ampliado para exigir uso de `padoka_add_staff_by_email`, probe sem efeito, fallback seguro quando a RPC não existe, validação de e-mail e proibição de `signUp`/escrita direta em `padoka_staff_users` pelo frontend.
- O workflow já executa `staff-management-frontend-audit.mjs`, portanto não foi necessária alteração da configuração da CI.
- Tentativa de executar `node --check` e a auditoria por clone local falhou porque o ambiente não conseguiu resolver `github.com` por DNS. O GitHub ainda não apresentou status de check para o commit final; por isso a CI não foi marcada como aprovada sem evidência.
- Nenhuma migration/RLS foi modificada nesta execução, portanto não havia advisor PADOKA novo para executar.
