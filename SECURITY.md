# Política de Segurança

A segurança deste projeto é tratada como parte do produto, especialmente nas áreas de autenticação, administração, pagamentos e integração com banco de dados.

## Como relatar uma vulnerabilidade

Se encontrar uma falha de segurança, **não publique senhas, tokens, dados de clientes ou detalhes exploráveis em uma issue pública**.

Prefira entrar em contato de forma privada com o responsável pelo projeto por meio dos canais oficiais da InfoTech.io.

## Regras do repositório

- Nunca versionar senhas, tokens privados ou chaves administrativas.
- Chaves `service_role` do Supabase nunca devem ser usadas no navegador.
- Arquivos `.env`, certificados e configurações locais devem permanecer fora do Git.
- A autorização real deve ser validada no backend/banco de dados, e não apenas pela interface.
- Alterações sensíveis devem ser testadas na branch `dev` antes de chegarem ao `main`.

## Supabase

Chaves publicáveis podem existir no frontend quando previstas para uso no navegador. A proteção dos dados deve continuar sendo garantida por autenticação, políticas RLS e permissões corretamente configuradas no Supabase.
