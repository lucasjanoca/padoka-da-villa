# PADOKA DA VILLA — Production Runbook

## Objetivo
Operar a PADOKA com mudanças pequenas, reversíveis e auditáveis. Nunca liberar manualmente pagamento, alterar dados financeiros no navegador ou usar dados demonstrativos como dados comerciais reais.

## Estado saudável
- GitHub Pages: último deploy concluído com sucesso.
- PADOKA Static Audit: verde.
- PADOKA CodeQL: verde.
- PADOKA Production Monitor: verde.
- Supabase Security Advisor: zero avisos específicos da PADOKA.
- Performance Advisor: nenhum WARN específico da PADOKA; índices "unused_index" são informativos até existir tráfego suficiente.
- Edge Functions críticas: ACTIVE.
- Pix: permanece fail-closed enquanto provider_configured=false.
- Catálogo demo: não é tratado como catálogo comercial real.

## Incidente
1. Não apagar logs, pedidos, movimentos ou tentativas de pagamento.
2. Confirmar o impacto: site, login, pedidos, PDV, Supabase, Push ou Pix.
3. Verificar GitHub Actions e o issue automático "PADOKA produção indisponível".
4. Se a falha começou após deploy, voltar para o último commit conhecido como estável.
5. Se a falha for apenas de feature opcional, desligar a feature flag antes de fazer rollback global.
6. Pagamentos nunca são marcados como pagos por print/comprovante do cliente.
7. Depois da recuperação, rodar Static Audit, CodeQL e Production Monitor novamente.
8. Registrar causa, correção e prevenção no CHANGELOG ou issue.

## Severidade
- SEV-1: risco financeiro, exposição de dados, autenticação quebrada, pedido pago perdido ou escrita indevida.
- SEV-2: checkout, PDV ou gestão indisponível sem exposição de dados.
- SEV-3: funcionalidade secundária, visual ou analytics degradados.

## Contenção
- Desligar feature flags opcionais.
- Manter checkout fail-closed se pagamento não puder ser confirmado pelo provedor.
- Não remover RLS, MFA, validação server-side ou idempotência para "fazer funcionar".
- Não colocar service_role/secret key no navegador.

## Recuperação
- Código: rollback de commit/branch.
- Banco: usar migration corretiva; não editar histórico de migrations já aplicadas.
- Dados: restaurar somente por procedimento de backup autorizado e depois reconciliar pedidos/pagamentos.
- Push: pode ser desativado sem bloquear pedidos.
- Telemetria: pode degradar sem bloquear fluxo comercial.

## Pós-incidente
- Identificar causa raiz.
- Criar teste de regressão quando a falha for reproduzível.
- Atualizar monitor se o incidente não tivesse sido detectado automaticamente.
