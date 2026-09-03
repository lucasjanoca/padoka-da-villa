# 2026-09-03 — Gestão de equipe: lifecycle de identidade no CI

## Segurança

- Adicionada a auditoria `tests/staff-management-lifecycle-audit.mjs` para preservar o comportamento fail-closed da aba interna **Equipe** durante logout e troca de conta.
- O CI agora exige que a limpeza invalide operações assíncronas da identidade anterior, remova painel/aba/navegação da equipe e encerre o canal Realtime `padoka-staff-management-ui` antes de aceitar outra identidade.
- A auditoria também mantém como contrato que a listagem de funcionários reconfirme o mesmo usuário `owner` antes e depois da RPC protegida e que atualizações Realtime passem pelo mesmo carregamento autorizado.
- Continua proibida a presença de `service_role`/`sb_secret_` no navegador e a criação de trigger global em `auth.users`.

## Escopo

- Nenhuma migration, RLS, policy, grant, trigger, Edge Function ou configuração OAuth foi alterada.
- Nenhum objeto não-`padoka_` foi alterado.
- Backend PADOKA permanece no projeto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`).
