# PADOKA — Estado das contas e autenticação

Atualizado em 02/09/2026.

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

## MFA e hardening administrativo

- `owner` e `manager` precisam de Supabase MFA/TOTP e AAL2 antes de abrir funcionalidades internas privilegiadas.
- O frontend redireciona para `mfa.html` quando uma sessão privilegiada ainda está em AAL1.
- A proteção também existe no PostgreSQL: mutações administrativas protegidas rejeitam `owner/manager` em AAL1.
- RPCs públicas consumidas pelo frontend são wrappers `SECURITY INVOKER`; implementações que precisam de privilégios elevados ficam em `padoka_private`.
- O Security Advisor do Supabase foi reexecutado após as migrations 038–040 e não retornou aviso relacionado à PADOKA.
- Funções exclusivas de trigger não são executáveis diretamente por `anon` ou `authenticated`.

## Pedidos e área interna

- `pagamento.html` cria pedidos exclusivamente pela RPC server-authoritative e idempotente `padoka_create_order_once_v3`, usando `request_id` persistido para reconciliar tentativas com resposta de rede ambígua sem duplicar o pedido e enviando a forma de pagamento explicitamente para validação no servidor; os finalizadores legados `padoka_create_order`, `padoka_create_order_once` e `padoka_create_order_once_v2` não fazem parte do runtime do checkout.
- O checkout público permanece fail-closed enquanto o Pix automático real não estiver integrado; comprovante ou confirmação manual não autoriza a criação do pedido.
- A camada idempotente do checkout acompanha `onAuthStateChange`: logout/troca de conta desabilita imediatamente a continuação da tentativa anterior, invalida respostas assíncronas pelo `lifecycleEpoch` e recarrega perfil/catálogo antes de permitir que uma nova identidade continue.
- O retry ambíguo do checkout fica em `sessionStorage` sob chave vinculada ao `user_id` do cliente. Logout/troca de conta não mistura nem apaga a tentativa persistida da identidade anterior; ao retornar, somente o mesmo cliente restaura aquele `request_id`, enquanto respostas da sessão antiga continuam sendo ignoradas após mudança de autenticação.
- `acompanhamento.html` carrega automaticamente somente pedidos do cliente autenticado e usa Realtime.
- A troca de conta em `acompanhamento.html` agora entra em estado visual fail-closed no próprio `onAuthStateChange`: incrementa `sessionGeneration`, troca a identidade ativa e remove imediatamente pedidos, itens, eventos e QR Pix da conta anterior antes de aguardar a remoção assíncrona do canal; a nova conta só recebe dados após o lifecycle atual ainda coincidir com `activeCustomerId + sessionGeneration`.
- `internal.html` e `pedidos.html` exigem sessão e registro ativo em `padoka_staff_users`.
- A fila interna de `pedidos.html` possui guard dedicado de lifecycle: logout ou troca de funcionário escondem e bloqueiam imediatamente a interface, encerram os canais Realtime da identidade anterior e só reconstroem a página depois de confirmar que a nova sessão ainda pertence a um `padoka_staff_users` ativo; respostas/estado da conta anterior não são reutilizados.
- A navegação interna também reage a logout/troca de conta via `onAuthStateChange`: limpa o papel anterior, invalida validações assíncronas antigas e resolve novamente o acesso da conta atual antes de manter módulos restritos visíveis.
- `padoka_update_order_status` está ativa no backend.
- O papel `authenticated` não possui mais `UPDATE` direto em `padoka_orders`.
- A fila interna não usa mais fallback de `UPDATE` direto: avanço/cancelamento passam exclusivamente pela RPC.
- O PDV finaliza somente pela RPC idempotente `padoka_create_sale_once`, reutilizando o mesmo `request_id` em tentativas ambíguas; a RPC legada `padoka_create_sale` não é executável por `anon` nem `authenticated`.
- Se a capability idempotente do PDV estiver indisponível, a finalização fica bloqueada em vez de retornar ao fluxo antigo sem `request_id`.
- O retry ambíguo do PDV fica em `sessionStorage` sob chave vinculada ao `user_id` do funcionário. Troca de conta limpa carrinho/estado em memória e revalida o novo staff, mas não mistura nem apaga o retry persistido da identidade anterior; ao retornar, somente a própria conta pode restaurar aquela tentativa e reutilizar o mesmo `request_id`.
- O leitor físico/câmera do PDV também acompanha o lifecycle de autenticação: buffers e códigos locais são invalidados na troca de conta, `padoka_list_product_barcodes` só pode atualizar o cache depois de revalidar epoch, `user_id`, sessão e capability `pdv`, e uma câmera iniciada pela identidade anterior não continua abrindo após troca de funcionário.
- O ajuste manual de saldo no estoque usa exclusivamente `padoka_adjust_inventory_once` com `request_id` persistido na sessão para retry/reconciliação segura; a RPC legada `padoka_adjust_inventory` não é executável por `anon` nem `authenticated`.
- O retry ambíguo de ajuste de estoque também fica sob chave vinculada ao `user_id` do funcionário. Logout/troca de conta invalida o estado operacional em memória e revalida a nova identidade, mas preserva a tentativa da conta original sem expô-la à conta seguinte; ao retornar, somente o mesmo funcionário reconcilia a operação com o mesmo `request_id`.
- O registro de produção usa retry idempotente vinculado ao `user_id` do funcionário. Logout/troca de conta remove somente o runtime e os controles da identidade anterior, preservando a tentativa ambígua em `sessionStorage`; ao retornar, somente a própria identidade reconcilia o mesmo `request_id`, plano e quantidade.
- A gestão de catálogo acompanha o lifecycle de autenticação do staff: logout ou troca de conta remove imediatamente os controles e dados em memória da identidade anterior, encerra o canal Realtime associado e invalida listagens/gravações assíncronas pelo `lifecycleEpoch`; a nova identidade só remonta o módulo depois de sessão e papel `owner`/`manager` serem revalidados.
- As configurações internas também são isoladas pelo lifecycle do staff: `padoka_get_settings` e `padoka_update_settings` capturam `user_id` + `lifecycleEpoch`, revalidam a sessão antes de aplicar qualquer resposta e mantêm controles bloqueados durante troca de conta; respostas atrasadas e callbacks Realtime da identidade anterior são descartados.

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
- A configuração pública prefere `sb_publishable_...`; funções administrativas do backend preferem `sb_secret_...`, mantendo chaves legadas somente como fallback temporário.
