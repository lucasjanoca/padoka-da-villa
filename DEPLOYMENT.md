# PADOKA DA VILLA — implantação segura do backend

Este guia existe para evitar que as migrations preparadas no repositório sejam aplicadas no projeto Supabase errado ou fora de ordem.

## Regra de ambiente

**Backend correto da PADOKA:** `Sites De Clientes!` — project ref `yncspxfsvlqdnodlsosb`.

**Nunca aplicar estas migrations no projeto `InfoTech.io`.**

Antes de qualquer SQL, confirme no dashboard/CLI que o project ref exibido é exatamente `yncspxfsvlqdnodlsosb`. Se não for, pare.

## Estado esperado antes da camada operacional

As migrations 001/002 representam a base já usada pelo site publicado:

- `padoka_profiles`
- `padoka_staff_users`
- `padoka_orders`
- `padoka_order_items`
- `padoka_order_events`
- `padoka_products`
- RPC de criação de pedido existente

Contas de outros sistemas do Supabase compartilhado não devem receber perfil PADOKA automaticamente. Não criar trigger global em `auth.users`.

## Pré-voo obrigatório

1. Confirmar project ref `yncspxfsvlqdnodlsosb`.
2. Confirmar que o ambiente contém os objetos `padoka_*` da base 001/002.
3. Fazer backup/snapshot adequado do banco antes do rollout operacional.
4. Rodar o workflow **PADOKA Static Audit** ou, localmente, todos os scripts de `tests/`.
5. Rodar especialmente `node tests/migration-chain-audit.mjs`.
6. Não substituir cardápio/preços provisórios por dados “reais” sem confirmação da padaria.
7. Não configurar Google OAuth sem Client ID/Secret emitidos pelo Google Cloud.

## Ordem de aplicação

Depois da base 001/002, aplicar **todos os arquivos numerados em ordem crescente, sem pular números**, do `003_*.sql` até a migration mais recente existente no repositório.

No estado auditado em 30/08/2026, a cadeia está contínua até:

- `038_privileged_mfa_hardening.sql` — exige AAL2/MFA para mutações privilegiadas de `owner/manager` e remove execução direta de funções exclusivas de trigger;
- `039_private_security_helpers.sql` — move helpers privilegiados para `padoka_private` e mantém wrappers públicos `SECURITY INVOKER`;
- `040_private_rpc_implementations.sql` — move as implementações das RPCs privilegiadas restantes para `padoka_private`, preservando as assinaturas públicas consumidas pelo frontend.

Não pular números. As migrations posteriores dependem do estado consolidado pelas anteriores.

## Validação após cada migration

Após **cada** aplicação:

- confirmar que somente objetos `padoka_*` esperados foram criados/alterados;
- confirmar RLS habilitado nas novas tabelas;
- confirmar que `anon` não ganhou acesso a módulos internos;
- confirmar que não foi criado trigger em `auth.users`;
- executar advisors de **Security** e **Performance** do Supabase;
- revisar qualquer aviso novo relacionado a objetos `padoka_*` antes de seguir para a próxima migration;
- fazer um smoke test com uma conta staff autorizada e uma conta cliente separada quando a migration afetar seus fluxos.

Avisos antigos pertencentes a outros sistemas do Supabase compartilhado não devem ser “corrigidos” como parte da PADOKA sem escopo e autorização próprios.

## Gates de ativação do frontend

Os frontends foram preparados para detectar as camadas novas e não devem simular sucesso quando elas ainda não existirem.

### Depois da 003

Validar em `gestao.html`:

- estoque real;
- EAN/estoque mínimo;
- planejamento de produção;
- perdas;
- Realtime operacional.

Só depois de validar os dados reais necessários, planejar a remoção do fallback temporário em `localStorage`.

### Depois da 004 + 010

Validar no `pdv.html`:

- venda com preço calculado pelo servidor;
- bloqueio por estoque insuficiente;
- baixa de estoque na mesma transação;
- retry com o mesmo `request_id` sem duplicar venda.

Enquanto o catálogo tiver `is_demo = true`, vendas devem continuar identificadas como teste/provisórias.

### Depois da 005

Validar em `pedidos.html` todas as transições:

`Recebido → Visto → Confirmado → Preparo → Pronto → Retirado`

Confirmar cancelamento autorizado e bloqueio de saltos/retrocessos. Depois dessa validação, remover em uma mudança separada o fallback de `UPDATE` direto do frontend.

### Depois da 006

Validar produção concluída, incremento de estoque, lote e movimentação em uma única operação, inclusive retry idempotente.

### Depois da 007

Validar perda com baixa de estoque e retry idempotente, sem desconto duplicado.

### Depois da 008

Validar relatórios apenas com `owner/manager`, período máximo e totais server-authoritative.

### Depois da 009

Validar leitura de configurações por staff e escrita somente por `owner/manager`.

### Depois da 011

Validar checkout idempotente: falha/retry não pode criar dois pedidos e o carrinho só deve ser apagado após confirmação real.

### Depois da 012

Validar estorno apenas por `owner/manager`, com motivo obrigatório, devolução de estoque e auditoria. Repetir o mesmo estorno não pode devolver estoque duas vezes.

### Depois da 013

Validar `conta.html` com uma conta cliente separada:

- primeiro acesso só cria `padoka_profiles` depois de nome, WhatsApp e consentimento de privacidade;
- aniversário e marketing continuam opcionais;
- `app_scope` permanece fixo em `padoka`;
- avatar e provedor de autenticação são derivados da sessão pelo servidor, não confiados ao navegador;
- edição do perfil usa `padoka_save_profile` e continua restrita ao próprio `auth.uid()`;
- escrita direta `INSERT/UPDATE` em `padoka_profiles` por `authenticated` deve estar revogada;
- conta de outro sistema do mesmo Supabase não ganha perfil PADOKA automaticamente.

Depois de validar a 013, remover em uma mudança separada o fallback temporário de escrita direta existente em `conta.html`.

### Depois da 014

Validar gestão de permissões internas com pelo menos dois usuários staff separados:

- funcionário comum consegue consultar apenas o próprio registro em `padoka_staff_users`;
- somente `owner` consegue executar `padoka_list_staff` e `padoka_update_staff` com sucesso;
- alteração aceita somente funções PADOKA conhecidas;
- a RPC não cria funcionário novo silenciosamente: o alvo precisa já existir em `padoka_staff_users`;
- owner não consegue remover o próprio acesso por engano;
- o último `owner` ativo não pode ser desativado nem rebaixado;
- `anon` e cliente PADOKA não ganham leitura/listagem da equipe;
- escrita direta `INSERT/UPDATE/DELETE` em `padoka_staff_users` por `authenticated` permanece revogada.

### Depois da 015

Validar a inclusão administrativa de um funcionário já autenticado:

- somente `owner` consegue executar `padoka_add_staff_by_email`;
- o e-mail precisa corresponder exatamente a uma identidade já existente em `auth.users`;
- a RPC não cria usuário Auth, não cria `padoka_profiles` e não altera contas de outros sistemas automaticamente;
- função inválida é rejeitada;
- usuário já cadastrado em `padoka_staff_users` é rejeitado como duplicado;
- cliente/anon não consegue executar a inclusão;
- a pessoa incluída só passa a ter acesso interno por causa do registro explícito em `padoka_staff_users`.

A migration 015 é apenas o mecanismo administrativo seguro de associação de uma identidade existente. Ela não envia convite, não cria senha e não deve ser confundida com um fluxo público de cadastro de funcionário.

### Depois da 016

Validar a trilha de auditoria de permissões internas:

- inclusão por `padoka_add_staff_by_email` gera exatamente um evento `added` em `padoka_staff_audit`;
- alteração efetiva por `padoka_update_staff` gera exatamente um evento `updated` com estado anterior e novo;
- repetir uma atualização sem mudança não cria evento vazio;
- somente `owner` consegue executar `padoka_list_staff_audit` e ler o histórico;
- `authenticated` não consegue inserir/alterar/excluir diretamente `padoka_staff_audit`;
- duas alterações concorrentes não podem remover todos os owners ativos; a proteção usa lock transacional administrativo;
- cliente, anon e funcionário sem papel `owner` não recebem o histórico de e-mails/funções;
- a aba **Equipe** mostra o histórico somente quando a RPC 016 existe; antes disso, o frontend continua funcionando sem bloco quebrado.

### Depois da 017

Validar a gestão autoritativa do catálogo em **Produtos**:

- somente `owner/manager` consegue executar `padoka_list_products_admin` e `padoka_save_product`;
- `anon`, cliente e staff sem função administrativa não conseguem alterar produtos;
- escrita direta `INSERT/UPDATE/DELETE` em `padoka_products` permanece revogada para `authenticated`;
- leitura pública dos produtos ativos continua funcionando pela RLS já existente;
- criar/editar produto valida ID, nome, categoria, preço, flags e ordem no servidor;
- desativar produto remove do cardápio público sem apagar histórico;
- produto provisório continua com `is_demo = true` até confirmação explícita dos dados oficiais;
- retirar a marca provisória na interface exige confirmação humana;
- produto novo sem metadados visuais próprios pode usar a logo temporária, mas não deve receber foto/unidade inventadas;
- alterações refletem no cardápio após recarga/sincronização e continuam server-authoritative.

### Depois da 038

- validar que `owner/manager` em AAL1 não conseguem executar mutações administrativas protegidas;
- validar que a mesma operação funciona após MFA/AAL2;
- confirmar que funções de trigger não são executáveis diretamente por `anon`/`authenticated`.

### Depois da 039 + 040

- confirmar que o schema `padoka_private` não é exposto como API pública;
- confirmar que as RPCs públicas esperadas continuam com os mesmos nomes/argumentos;
- confirmar que wrappers públicos são `SECURITY INVOKER`;
- executar o Security Advisor e exigir **zero avisos relacionados à PADOKA**;
- executar o workflow completo `PADOKA Static Audit`.

## Critérios para chamar a camada operacional de pronta

- migrations aplicadas no projeto correto e sem warnings de segurança PADOKA pendentes;
- owner/manager protegidos por MFA/AAL2 também no banco;
- implementações privilegiadas fora do schema público, com wrappers SECURITY INVOKER;
- RLS testado com cliente, staff e usuário de outro sistema do mesmo Supabase;
- nenhuma área interna acessível pelo site público;
- checkout e PDV idempotentes;
- estoque sem escrita direta insegura pelo navegador;
- produção/perdas transacionais;
- relatórios financeiros restritos;
- onboarding de cliente controlado por RPC após a migration 013;
- gestão de permissões internas restrita a owner após a migration 014;
- inclusão de staff existente explicitamente autorizada por owner após a migration 015;
- alterações de acesso de staff auditadas e legíveis somente por owner após a migration 016;
- gestão do catálogo restrita a owner/manager e sem escrita direta após a migration 017;
- dados provisórios continuam marcados como provisórios até confirmação oficial;
- Google OAuth só é marcado como pronto depois das credenciais reais e teste de `prompt=select_account`.
