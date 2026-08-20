import fs from 'node:fs';

const sql=fs.readFileSync(new URL('../supabase/008_staff_reporting_rpc.sql',import.meta.url),'utf8');
const must=(needle,msg)=>{if(!sql.includes(needle))throw new Error(msg)};
const mustNot=(needle,msg)=>{if(sql.includes(needle))throw new Error(msg)};

must("create or replace function public.padoka_report_summary",'RPC de relatório ausente');
must("security definer",'RPC precisa ser SECURITY DEFINER');
must("set search_path = public",'RPC precisa fixar search_path');
must("padoka_staff_has_role(array['owner','manager'])",'Relatórios financeiros devem exigir owner/manager');
must("report range too large",'RPC deve limitar intervalo de consulta');
must("timezone('America/Sao_Paulo'",'Relatório precisa agrupar datas no fuso da padaria');
must("s.status = 'completed'",'Vendas anuladas não podem entrar no total');
must("count(*) filter (where s.is_test)",'Relatório deve separar vendas provisórias');
must("count(*) filter (where o.is_test)",'Relatório deve identificar pedidos provisórios');
must("has_provisional_data",'Resposta deve sinalizar dados provisórios');
must("padoka_inventory",'Resumo deve considerar estoque');
must("padoka_losses",'Resumo deve considerar perdas');
must("padoka_production_plans",'Resumo deve considerar produção');
must("padoka_sale_items",'Resumo deve calcular produtos mais vendidos a partir dos itens reais');
must("revoke all on function public.padoka_report_summary(date,date) from public, anon",'RPC não pode ficar executável por anon/public');
must("grant execute on function public.padoka_report_summary(date,date) to authenticated",'Staff autenticado precisa conseguir chamar a RPC antes da validação de papel interna');
mustNot('create trigger','Migration de relatório não deve criar triggers');
mustNot('auth.users','Migration de relatório não deve tocar auth.users');
mustNot('grant execute on function public.padoka_report_summary(date,date) to anon','Anon não pode executar relatório interno');

console.log('reporting-rpc-audit: ok');
