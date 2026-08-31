## 2026-08-31 11:38 — Self-check passa a vigiar escrita direta interna
- Relidos `README.md`, `CHANGELOG.md` e `AUTH_STATUS.md` e confirmado o backend correto **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`); o projeto InfoTech.io permaneceu intocado.
- Confirmado no banco antes da mudança que `authenticated` não possui `INSERT`, `UPDATE` ou `DELETE` direto nas tabelas `padoka_*` operacionais e que as operações críticas seguem por RPCs autorizadas no servidor.
- Criada e aplicada a migration `069_security_self_check_internal_direct_dml.sql`, ampliando `padoka_private.padoka_security_self_check()` para detectar regressões de DML direto em estoque, movimentos, produção, perdas, vendas, configurações, compras, auditoria, pagamentos e Push.
- A verificação cobre privilégios em nível de tabela e também concessões de `INSERT`/`UPDATE` por coluna, evitando que uma futura permissão parcial passe despercebida.
- O self-check continua `SECURITY DEFINER` no schema privado, com `search_path=''`, sem `EXECUTE` para `public`, `anon` ou `authenticated`; somente `service_role` mantém execução.
- Executado o self-check após a aplicação: retornou `ok=true` e `issues=[]`.
- `tests/database-security-self-check-audit.mjs` passou a exigir a nova proteção e a lista mínima de tabelas internas monitoradas.
- O `PADOKA Static Audit` #1012 concluiu com sucesso, incluindo `Run every PADOKA audit`.
- Security Advisor reexecutado após a migration: nenhum aviso relacionado à PADOKA; permaneceram somente avisos de objetos `rass_*` e a configuração global de proteção contra senhas vazadas, sem alterações fora do escopo PADOKA.
