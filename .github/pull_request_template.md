## PADOKA change checklist

- [ ] O PADOKA Static Audit passa.
- [ ] Não adicionei segredos, service-role keys ou credenciais ao frontend.
- [ ] Não adicionei JavaScript remoto/CDN.
- [ ] Alterações de banco preservam RLS e privilégios mínimos.
- [ ] Alterações em checkout preservam idempotência e validação server-side.
- [ ] Alterações internas preservam validação de sessão/perfil e comportamento fail-closed.
- [ ] Alterações no CSP incluem hashes atualizados quando necessário.
- [ ] Testei as superfícies afetadas em produção ou em ambiente equivalente.

### Segurança

Descreva qualquer mudança em autenticação, autorização, dados, pagamentos, Push, CSP, dependências ou permissões.
