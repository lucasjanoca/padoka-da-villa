import fs from 'node:fs';

const nav=fs.readFileSync('assets/internal-nav.js','utf8');
const ui=fs.readFileSync('assets/admin-dashboard-live.js','utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const need=(src,re,m)=>{if(!re.test(src))fail(m)};
const forbid=(src,re,m)=>{if(re.test(src))fail(m)};

need(nav,/isAdmin/i,'navegação interna precisa detectar o painel administrativo');
need(nav,/assets\/admin-dashboard-live\.js/i,'painel precisa carregar a sincronização ao vivo');
need(ui,/America\/Sao_Paulo/i,'métricas de hoje precisam usar o fuso da padaria');
need(ui,/DateTimeFormat/i,'data do dia precisa ser calculada por fuso, não pelo relógio local do navegador');
need(ui,/padoka_orders/i,'painel precisa ler os pedidos reais');
need(ui,/gte\('created_at',since\)/i,'consulta precisa limitar a janela recente antes de filtrar o dia');
need(ui,/status!==['"]cancelled['"]/i,'valor em pedidos não deve somar cancelados');
need(ui,/padoka-admin-dashboard-live/i,'painel precisa reagir em tempo real');
need(ui,/postgres_changes/i,'Realtime precisa ouvir mudanças de pedidos');
need(ui,/Sem pedidos hoje/i,'estado vazio deve falar sobre o dia atual');
need(ui,/VALOR EM PEDIDOS/i,'dashboard não deve chamar pedidos de faturamento/venda paga');
need(ui,/\.from\(['"]padoka_inventory['"]\)\.select\(/i,'alerta operacional precisa ler estoque real quando a camada existir');
need(ui,/\.from\(['"]padoka_production_plans['"]\)\.select\(/i,'alerta operacional precisa ler produção real quando a camada existir');
need(ui,/min_quantity/i,'estoque baixo precisa respeitar estoque mínimo configurado');
need(ui,/PRODUÇÃO PENDENTE HOJE/i,'painel precisa destacar produção pendente do dia');
need(ui,/missingOperationalLayer/i,'painel deve tolerar migrations operacionais ainda não aplicadas');
need(ui,/PGRST205|42P01/i,'detecção da camada ausente precisa tratar erro de tabela inexistente');
need(ui,/padoka-admin-inventory-live/i,'estoque precisa atualizar o painel em tempo real quando disponível');
need(ui,/padoka-admin-production-live/i,'produção precisa atualizar o painel em tempo real quando disponível');
forbid(ui,/\.from\(['"]padoka_orders['"]\)\.(insert|update|delete|upsert)/is,'dashboard é leitura e não pode alterar pedidos');
forbid(ui,/\.from\(['"]padoka_inventory['"]\)\.(insert|update|delete|upsert)/is,'dashboard não pode alterar estoque');
forbid(ui,/\.from\(['"]padoka_production_plans['"]\)\.(insert|update|delete|upsert)/is,'dashboard não pode alterar produção');
forbid(ui,/localStorage|sessionStorage/i,'métricas do painel não devem depender de estado local');

if(!process.exitCode)console.log('Admin dashboard audit: OK');
