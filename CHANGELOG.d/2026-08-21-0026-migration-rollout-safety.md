# 2026-08-21 00:26 — Rollout das migrations operacionais protegido

- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` antes da alteração.
- Confirmado pelo conector Supabase que a conexão disponível continua expondo somente **InfoTech.io** (`rgngqumqzylthdiazvfu`); nenhuma query, migration, advisor ou alteração foi executada nesse projeto.
- O backend correto da PADOKA continua sendo **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`).
- Criado `tests/migration-chain-audit.mjs` para auditar a cadeia 001→012 antes de qualquer rollout de banco.
- A auditoria impede lacunas na numeração, criação de tabelas/funções fora do namespace `padoka_`, trigger global em `auth.users`, escrita direta no schema `auth`, operações destrutivas `DROP/TRUNCATE` e `SECURITY DEFINER` sem `search_path=public` explícito.
- O teste também confirma dependências essenciais entre estoque, PDV, status, produção, perdas, relatórios, configurações, idempotência do checkout/PDV e estorno.
- Grants para `anon` ficam restritos ao catálogo público da migration 002; migrations internas posteriores não podem ampliar acesso público silenciosamente.
- `.github/workflows/padoka-audit.yml` foi atualizado para validar sintaxe e executar a nova auditoria em push/PR para `main`.
- Criado `DEPLOYMENT.md` com ordem obrigatória 003→012, gates de ativação por módulo, verificação de RLS, advisors após cada migration e regra explícita para nunca aplicar a cadeia no InfoTech.io.
- O `node --check` do novo script passou localmente. A auditoria completa depende do checkout integral do repositório/CI; não foi marcada como aprovada sem evidência de uma execução remota concluída.
- Nenhuma mudança de banco/RLS foi aplicada nesta execução, portanto não havia advisors da PADOKA disponíveis para consultar nesta rodada.
