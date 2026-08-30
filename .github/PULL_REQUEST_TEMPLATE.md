## PADOKA — checklist de mudança

### Escopo
- [ ] A mudança é pequena, reversível e tem objetivo claro.
- [ ] Não altera catálogo/preços reais sem aprovação da padaria.
- [ ] Não libera Pix manual nem contorna confirmação do provedor.

### Segurança
- [ ] Nenhuma secret/service_role/private key foi adicionada ao frontend/repositório.
- [ ] RLS/RPC/MFA/idempotência continuam fail-closed.
- [ ] CSP não ganhou `unsafe-inline` em scripts nem origem remota desnecessária.
- [ ] Dependências novas estão pinadas em versão exata e justificadas.

### Banco
- [ ] Migration nova é incremental; migration aplicada não foi reescrita.
- [ ] Migration foi testada com BEGIN/ROLLBACK quando aplicável.
- [ ] Security Advisor continua sem lints PADOKA.
- [ ] Performance Advisor foi revisado.

### Frontend/PWA
- [ ] Mobile e acessibilidade foram preservados.
- [ ] Service Worker/cache foi revisado se assets críticos mudaram.
- [ ] Assets locais/vendored continuam publicados e com hash/integrity.

### Validação
- [ ] PADOKA Static Audit verde.
- [ ] CodeQL verde.
- [ ] Pages deploy verde.
- [ ] Production Monitor verde.
- [ ] Browser E2E verde quando a mudança afeta runtime público.
