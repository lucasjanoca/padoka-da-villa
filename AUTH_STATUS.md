# PADOKA — Estado das contas e autenticação

Atualizado em 25/08/2026.

## O que está ativo

- O projeto da PADOKA usa o Supabase **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`).
- O projeto **InfoTech.io não é usado pela PADOKA**.
- A conta pública usa Supabase Auth real; não existem contas demo para o cliente.
- Login por Google, e-mail/senha e link por e-mail usam o Auth real.
- O login Google está operacional: o backend já possui identidades Google reais.
- O frontend mantém `prompt=select_account` no `signInWithOAuth`, forçando a escolha da conta quando o fluxo Google é aberto.
- O retorno autorizado da conta é `https://lucasjanoca.github.io/padoka-da-villa/conta.html`.
- A callback do projeto é `https://yncspxfsvlqdnodlsosb.supabase.co/auth/v1/callback`.

## Onboarding do cliente

No primeiro acesso:
- nome/e-mail são pré-preenchidos quando o provider entrega esses dados
- o nome pode ser editado
- telefone / WhatsApp é obrigatório
- consentimento de privacidade é obrigatório
- aniversário é opcional
- marketing é opcional
- endereço só deve ser solicitado em fluxo que realmente tenha entrega
- CPF não é obrigatório por padrão

O perfil só é criado/confirmado em `padoka_profiles` dentro do fluxo PADOKA. Não existe trigger global em `auth.users` criando perfil PADOKA para toda conta nova do projeto compartilhado.

## Isolamento das contas

O projeto Supabase é compartilhado por mais de um sistema, portanto `auth.users` é global ao projeto. O isolamento PADOKA continua sendo feito pela aplicação e pelo banco:

1. Perfil de cliente PADOKA existe somente em `padoka_profiles` e exige `app_scope = 'padoka'`.
2. Cliente autenticado só lê/edita o próprio perfil conforme RLS.
3. Pedidos são vinculados ao `auth.uid()` e só ficam disponíveis ao próprio cliente.
4. Funcionários ficam em `padoka_staff_users`, separados de clientes e de outros sistemas.
5. Nenhuma permissão interna é concedida apenas porque uma pessoa possui conta no mesmo Supabase.
6. Objetos exclusivos da PADOKA continuam com prefixo `padoka_`.

Isso evita mistura operacional com objetos `rass_*`, `emp_*`, `plexo_*` e demais sistemas existentes no projeto compartilhado.

## Pedidos e área interna

- `pagamento.html` cria pedidos por RPC server-authoritative `padoka_create_order`.
- `acompanhamento.html` carrega automaticamente somente pedidos do cliente autenticado e usa Realtime.
- `internal.html` e `pedidos.html` exigem sessão e registro ativo em `padoka_staff_users`.
- `padoka_update_order_status` está ativa no backend.
- O papel `authenticated` não possui mais `UPDATE` direto em `padoka_orders`.
- A fila interna não usa mais fallback de `UPDATE` direto: avanço/cancelamento passam exclusivamente pela RPC.

## Google Auth

O estado antigo `provider is not enabled` não representa mais a situação atual. Depois da configuração manual do Google OAuth no Google Cloud e no Supabase, autenticações Google reais passaram a ocorrer.

O frontend continua preservando tratamento amigável caso o provider volte a ficar indisponível ou a pré-verificação falhe por rede; nenhuma credencial secreta é armazenada no repositório.

Nunca colocar Client Secret, `service_role` ou outra chave administrativa em HTML/JavaScript público.

## Segurança

- Todas as alterações PADOKA devem permanecer no projeto `yncspxfsvlqdnodlsosb`.
- Não alterar objetos de outros sistemas apenas para limpar alertas de um projeto compartilhado.
- Antes de DDL/RLS, revisar privilégios mínimos, `auth.uid()`, papel permitido e `search_path` de funções `SECURITY DEFINER`.
- Funções sensíveis devem validar autenticação/autorização no servidor; não ampliar grants para contornar erros do frontend.
- Tabelas privadas não precisam ganhar policy de navegador quando o acesso direto não é necessário.
- Edge Functions sensíveis devem manter JWT quando aplicável, CORS restrito e validação rigorosa de entrada.
