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
forbid(ui,/\.from\(['"]padoka_orders['"]\)\.(insert|update|delete|upsert)/is,'dashboard é leitura e não pode alterar pedidos');
forbid(ui,/localStorage|sessionStorage/i,'métricas do painel não devem depender de estado local');

if(!process.exitCode)console.log('Admin dashboard audit: OK');
