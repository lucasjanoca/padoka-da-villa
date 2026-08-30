# PADOKA DA VILLA — Release, Rollback & SLO

## Fluxo de release
1. Desenvolver/testar fora da operação real sempre que possível.
2. Rodar todos os arquivos tests/*.mjs.
3. CodeQL deve estar verde.
4. Não liberar segredo novo em frontend.
5. Migrations: testar em BEGIN/ROLLBACK quando aplicável.
6. Aplicar migration e rodar Security/Performance Advisor.
7. Publicar Pages.
8. Production Monitor deve validar a superfície publicada.
9. Se houver regressão: rollback ou feature flag, não hotfix inseguro.

## Branches
- main: produção.
- staging: homologação de código, sem garantia de backend separado.
- backup-before-*: checkpoints de segurança antes de mudanças grandes.

## SLOs iniciais
Os números abaixo são metas de engenharia, não garantias contratuais:
- disponibilidade da superfície pública: >= 99,5% mensal;
- erro de frontend: tendência monitorada e incidentes críticos tratados como SEV-1/2;
- Core Web Vitals: LCP p75 <= 2,5s; INP p75 <= 200ms; CLS p75 <= 0,1;
- alterações financeiras: 100% server-authoritative;
- pedidos duplicados por retry: meta zero via idempotência;
- escrita anônima em tabelas internas: zero;
- Security Advisor PADOKA: zero lints de segurança conhecidos.

## Error budget
Com SLO 99,5%, o orçamento mensal de indisponibilidade é acompanhado, mas só deve virar KPI formal após existir medição externa contínua suficiente.

## Rollback
- Frontend: retornar main ao commit estável anterior.
- Feature: preferir desligar feature flag quando possível.
- Banco: nunca "desaplicar" migration apagando histórico; criar migration corretiva.
- Pagamento: fail-closed durante incerteza.
- Service Worker: bump do cache/version se um asset defeituoso tiver sido cacheado.

## Critérios de go-live comercial
- catálogo/preços/barcodes oficiais aprovados;
- Pix real com webhook autenticado e testes de idempotência;
- testes físicos em celular/PDV/scanner/rede instável;
- backup e restore testados;
- decisão fiscal/NFC-e;
- staging de banco separado se o risco/escala justificar.
