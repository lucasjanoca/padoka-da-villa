# PADOKA — Estado das contas e autenticação

Atualizado em 19/08/2026.

## O que já está ativo

- O projeto da PADOKA usa o Supabase **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`), sem tocar no projeto InfoTech.io.
- Criadas as tabelas exclusivas `padoka_profiles`, `padoka_staff_users`, `padoka_orders`, `padoka_order_items` e `padoka_order_events`.
- Todas as tabelas PADOKA estão com Row Level Security habilitado.
- Contas de outros sistemas do mesmo Supabase **não viram clientes PADOKA automaticamente**. Um usuário só entra em `padoka_profiles` quando acessa a PADOKA e completa o onboarding.
- Cliente autenticado só lê/edita o próprio perfil e só lê os próprios pedidos.
- Funcionários PADOKA são separados em `padoka_staff_users` e não recebem acesso por serem usuários de outro sistema.
- O site público `conta.html` foi conectado ao Supabase real e removeu os botões/contas de demonstração.
- Login por e-mail/senha e link por e-mail usam Supabase Auth real.
- O botão **Continuar com Google** usa o fluxo real `signInWithOAuth` do Supabase.
- No primeiro acesso, o cliente confirma/edita nome e informa WhatsApp; aniversário e marketing são opcionais.
- Depois do onboarding, o perfil é salvo em `padoka_profiles` com o UUID real do usuário autenticado.
- Foi criada a Edge Function pública `padoka-public-config` para entregar ao site somente a configuração pública necessária do cliente Supabase, sem gravar chave administrativa no GitHub.
- `pagamento.html` agora cria pedidos reais no banco por meio de `padoka_create_order`, sempre vinculados ao usuário autenticado.
- Os pedidos atuais são marcados como `is_test = true` enquanto cardápio/preços/Pix oficiais ainda não foram aprovados.
- `acompanhamento.html` consulta o pedido real do cliente e recebe atualizações de status pelo Supabase Realtime.
- `pedidos.html` consulta a fila real e só funciona para usuários existentes em `padoka_staff_users`.
- Ao abrir um pedido novo na área interna, o estado pode mudar de `received` para `seen`, permitindo ao cliente ver quando a padaria visualizou.
- `internal.html` usa login real e recusa usuários que não tenham permissão específica da equipe PADOKA.

## Isolamento das contas

O projeto Supabase é compartilhado por mais de um sistema, portanto `auth.users` é global ao projeto. O isolamento da PADOKA é feito pela camada de aplicação e banco:

1. Não existe trigger global criando perfil PADOKA para todo usuário novo.
2. Perfil PADOKA existe somente em `padoka_profiles` e exige `app_scope = 'padoka'`.
3. RLS limita o perfil ao próprio `auth.uid()`.
4. Pedidos são vinculados ao `auth.uid()` e só podem ser criados quando o onboarding PADOKA estiver concluído.
5. Equipe interna usa `padoka_staff_users`, separada de clientes e das tabelas de outros sistemas.

Isso evita mistura operacional com `rass_*`, `emp_*`, `plexo_*` e outras tabelas existentes.

## Google — último requisito externo

A interface e o código já estão prontos para Google real. Para a autenticação Google efetivamente abrir a seleção de conta, o provider Google do projeto Supabase precisa ter um **Google OAuth Client ID e Client Secret** cadastrados e o endereço do GitHub Pages precisa estar autorizado como redirect. Esses dados são emitidos no Google Cloud/Google Auth Platform e não podem ser inventados pelo projeto.

Callback do projeto Supabase a cadastrar no Google:

`https://yncspxfsvlqdnodlsosb.supabase.co/auth/v1/callback`

Origem do site:

`https://lucasjanoca.github.io`

Retorno da conta PADOKA:

`https://lucasjanoca.github.io/padoka-da-villa/conta.html`

## Segurança revisada

Depois das migrations PADOKA, o advisor de segurança foi executado. Os avisos criados inicialmente para funções PADOKA `SECURITY DEFINER` foram corrigidos. Os avisos restantes encontrados pelo advisor pertencem a objetos preexistentes de outros sistemas do projeto e não foram alterados nesta etapa para evitar interferência entre clientes.
