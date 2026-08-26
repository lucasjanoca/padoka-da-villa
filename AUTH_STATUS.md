# PADOKA — Estado das contas e autenticação

Atualizado em 26/08/2026.

## O que está ativo

- O projeto da PADOKA usa o Supabase **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`).
- O projeto **InfoTech.io não é usado pela PADOKA**.
- A conta pública usa Supabase Auth real; não existem contas demo para o cliente.
- Login por e-mail/senha e link por e-mail usam o Auth real.
- O login Google é a opção principal planejada, porém **ainda depende de Client ID/Client Secret reais criados no Google Cloud e do provider Google ser habilitado no Supabase**.
- Nenhuma credencial Google deve ser inventada, simulada ou armazenada no repositório.
- Quando o provider Google estiver habilitado, o frontend mantém `prompt=select_account` no `signInWithOAuth`, solicitando a escolha da conta ao abrir o fluxo.
- Enquanto o provider estiver desativado, o frontend deve manter tratamento amigável e permitir o uso das opções de autenticação já disponíveis.
- O retorno autorizado previsto para a conta é `https://lucasjanoca.github.io/padoka-da-villa/conta.html`.
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

O provider Google **não deve ser considerado ativo até que** o OAuth seja configurado manualmente com credenciais reais no Google Cloud e habilitado no Supabase do projeto `yncspxfsvlqdnodlsosb`.

O frontend consulta o estado do provider antes do redirecionamento. Se o Supabase informar explicitamente que Google está desativado, o cliente recebe uma mensagem simples de indisponibilidade e pode continuar usando e-mail/senha ou link por e-mail. Se a pré-verificação falhar apenas por rede, o botão pode tentar o OAuth para evitar um falso negativo.

Quando habilitado, o fluxo Google deve continuar usando `prompt=select_account` e retornar para `conta.html`.

Nunca colocar Client Secret, `service_role` ou outra chave administrativa em HTML/JavaScript público.

## Segurança

- Todas as alterações PADOKA devem permanecer no projeto `yncspxfsvlqdnodlsosb`.
- Não alterar objetos de outros sistemas apenas para limpar alertas de um projeto compartilhado.
- Antes de DDL/RLS, revisar privilégios mínimos, `auth.uid()`, papel permitido e `search_path` de funções `SECURITY DEFINER`.
- Funções sensíveis devem validar autenticação/autorização no servidor; não ampliar grants para contornar erros do frontend.
- Tabelas privadas não precisam ganhar policy de navegador quando o acesso direto não é necessário.
- Edge Functions sensíveis devem manter JWT quando aplicável, CORS restrito e validação rigorosa de entrada.
