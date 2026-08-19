# PADOKA — Estado das contas e autenticação

Atualizado em 19/08/2026.

## O que já está ativo

- O projeto da PADOKA usa o Supabase **Sites De Clientes!** (`yncspxfsvlqdnodlsosb`), sem tocar no projeto InfoTech.io.
- Criadas as tabelas exclusivas `padoka_profiles`, `padoka_staff_users`, `padoka_orders`, `padoka_order_items` e `padoka_order_events`.
- Todas as tabelas PADOKA estão com Row Level Security habilitado.
- Contas de outros sistemas do mesmo Supabase **não viram clientes PADOKA automaticamente**. Um usuário só entra em `padoka_profiles` quando acessa a PADOKA e completa o onboarding.
- Cliente autenticado só lê/edita o próprio perfil e só lê os próprios pedidos.
- Funcionários PADOKA são separados em `padoka_staff_users` e não recebem acesso por serem usuários de outro sistema.
- O site público `conta.html` foi conectado ao Supabase real e não usa contas de demonstração.
- Login por e-mail/senha e link por e-mail usam Supabase Auth real.
- O botão **Continuar com Google** usa o fluxo real `signInWithOAuth` e solicita `prompt=select_account` quando o provider estiver habilitado.
- No primeiro acesso, o cliente confirma/edita nome e informa WhatsApp; aniversário e marketing são opcionais.
- Depois do onboarding, o perfil é salvo em `padoka_profiles` com o UUID real do usuário autenticado.
- Foi criada a Edge Function pública `padoka-public-config` para entregar ao site somente a configuração pública necessária do cliente Supabase, sem gravar chave administrativa no GitHub.
- `pagamento.html` cria pedidos reais no banco por meio de `padoka_create_order`, sempre vinculados ao usuário autenticado.
- Os pedidos atuais são marcados como `is_test = true` enquanto cardápio/preços/Pix oficiais ainda não foram aprovados.
- `acompanhamento.html` lista automaticamente apenas os pedidos do cliente autenticado, mais recentes primeiro, e recebe atualizações pelo Supabase Realtime.
- `pedidos.html` consulta a fila real e só funciona para usuários existentes em `padoka_staff_users`.
- `internal.html` usa login real e recusa usuários que não tenham permissão específica da equipe PADOKA.

## Isolamento das contas

O projeto Supabase é compartilhado por mais de um sistema, portanto `auth.users` é global ao projeto. O isolamento da PADOKA é feito pela camada de aplicação e banco:

1. Não existe trigger global criando perfil PADOKA para todo usuário novo.
2. Perfil PADOKA existe somente em `padoka_profiles` e exige `app_scope = 'padoka'`.
3. RLS limita o perfil ao próprio `auth.uid()`.
4. Pedidos são vinculados ao `auth.uid()` e só podem ser criados quando o onboarding PADOKA estiver concluído.
5. Equipe interna usa `padoka_staff_users`, separada de clientes e das tabelas de outros sistemas.

Isso evita mistura operacional com `rass_*`, `emp_*`, `plexo_*` e outras tabelas existentes.

## Google — estado verificado em 19/08/2026

Os logs do Auth do projeto registraram a tentativa de login Google com o erro **`provider is not enabled`**. Portanto o bloqueio atual não está no botão do site: o provider Google ainda não possui configuração ativa no Auth do projeto.

O código do site já está preparado para, assim que o provider estiver ativo, abrir o Google com `prompt=select_account`, forçando a tela de escolha de conta em vez de reutilizar silenciosamente uma sessão anterior.

Para habilitar o provider são obrigatórios dados emitidos pelo Google Auth Platform/Google Cloud:

- Google OAuth **Client ID** (aplicação Web)
- Google OAuth **Client Secret**

Essas credenciais devem ser criadas na conta Google responsável pela aplicação e então cadastradas no provider Google do projeto Supabase. Elas não podem ser inventadas pelo código nem pelo banco de dados.

### Endereços já definidos

Callback do projeto Supabase a cadastrar no Google:

`https://yncspxfsvlqdnodlsosb.supabase.co/auth/v1/callback`

Origem autorizada do site:

`https://lucasjanoca.github.io`

Retorno da conta PADOKA:

`https://lucasjanoca.github.io/padoka-da-villa/conta.html`

Depois de cadastrar o Client ID e Client Secret no provider Google do Supabase, confirmar também que o retorno da conta PADOKA está na lista de Redirect URLs permitidas do Auth.

## Experiência do cliente enquanto o Google estiver desativado

- A tela pública não exibe mais mensagem técnica citando Supabase ao cliente.
- O botão Google continua no local correto.
- Se o provider ainda estiver indisponível, a página mostra somente uma mensagem simples informando indisponibilidade temporária e mantém login por e-mail funcionando.
- Assim que o provider for ativado no servidor, a mesma página detecta automaticamente a disponibilidade e usa o fluxo Google real sem nova alteração no frontend.

## Segurança revisada

Depois das migrations PADOKA, o advisor de segurança foi executado. Os avisos criados inicialmente para funções PADOKA `SECURITY DEFINER` foram corrigidos. Os avisos restantes encontrados pelo advisor pertencem a objetos preexistentes de outros sistemas do projeto e não foram alterados nesta etapa para evitar interferência entre clientes.