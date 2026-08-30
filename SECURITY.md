# Política de Segurança

A segurança deste projeto é tratada como parte do produto, especialmente nas áreas de autenticação, administração, pagamentos e integração com banco de dados.

## Estado de hardening

Em 30/08/2026, a camada PADOKA foi revalidada contra o banco de produção:

- todas as tabelas `padoka_*` expostas mantêm RLS habilitado;
- `anon` não possui escrita em tabelas internas;
- escrita direta por `authenticated` permanece revogada nas tabelas operacionais;
- RPCs públicas usadas pelo frontend são wrappers `SECURITY INVOKER`;
- implementações privilegiadas ficam no schema `padoka_private`, fora da superfície normal do Data API;
- funções exclusivas de trigger não são executáveis diretamente por `anon` ou `authenticated`;
- `owner` e `manager` precisam atingir AAL2/MFA para mutações administrativas sensíveis;
- Edge Functions sensíveis validam identidade no servidor e não confiam em valor/status enviados pelo navegador;
- o Security Advisor do Supabase não apresenta aviso relacionado à PADOKA após as migrations de hardening;
- o workflow `PADOKA Static Audit` executa todos os arquivos `tests/*.mjs` em cada push/PR e também pode ser disparado manualmente.

## Como relatar uma vulnerabilidade

Se encontrar uma falha de segurança, **não publique senhas, tokens, dados de clientes ou detalhes exploráveis em uma issue pública**.

Prefira entrar em contato de forma privada com o responsável pelo projeto por meio dos canais oficiais da InfoTech.io.

## Regras do repositório

- Nunca versionar senhas, tokens privados ou chaves administrativas.
- Chaves administrativas/secretas do Supabase nunca devem ser usadas no navegador.
- Preferir chaves `sb_publishable_...` no frontend e `sb_secret_...` somente no backend; fallbacks legados existem apenas para compatibilidade temporária.
- Arquivos `.env`, certificados e configurações locais devem permanecer fora do Git.
- A autorização real deve ser validada no backend/banco de dados, e não apenas pela interface.
- Alterações sensíveis devem preservar as migrations e testes de segurança e só são consideradas concluídas com o workflow verde.
- `.nojekyll` não deve ser recriado: `_config.yml` exclui migrations, testes e documentação técnica do artefato servido pelo GitHub Pages.

## Supabase

Chaves publicáveis podem existir no frontend quando previstas para uso no navegador. A proteção dos dados deve continuar sendo garantida por autenticação, políticas RLS, privilégios mínimos e RPCs corretamente configuradas.

Funções que precisam de `SECURITY DEFINER` devem permanecer fora do schema público sempre que possível. Os nomes públicos consumidos pelo frontend devem continuar como wrappers `SECURITY INVOKER`, preservando a API sem expor a implementação privilegiada.

## MFA administrativo

- `owner` e `manager` são direcionados para `mfa.html` quando a sessão ainda está em AAL1.
- O fator usado é TOTP via Supabase MFA.
- A proteção não depende somente da tela: triggers no banco bloqueiam mutações administrativas privilegiadas quando o JWT não está em `aal2`.
- Operações de cliente que não são administrativas continuam funcionando em AAL1.

## Pagamentos

O Pix automático permanece fail-closed até existir um provedor real configurado. Nenhum comprovante, flag `paid`, valor, txid ou total enviado pelo navegador é autoridade de pagamento.

A Edge Function `padoka-pix-checkout` exige JWT, valida o dono do pedido, usa o total armazenado no servidor e bloqueia o fluxo quando o provedor não está configurado.
