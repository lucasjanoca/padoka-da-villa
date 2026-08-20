import fs from 'node:fs';

const sql=fs.readFileSync('supabase/012_pdv_sale_void_transaction.sql','utf8');
const fail=(m)=>{console.error('FAIL:',m);process.exitCode=1};
const need=(re,m)=>{if(!re.test(sql))fail(m)};
const forbid=(re,m)=>{if(re.test(sql))fail(m)};

need(/add column if not exists void_reason text/i,'padoka_sales precisa registrar motivo do estorno');
need(/create or replace function public\.padoka_void_sale/i,'faltou RPC transacional de estorno');
need(/padoka_staff_has_role\(array\['owner','manager'\]\)/i,'estorno precisa ficar restrito a owner/manager');
need(/char_length\(v_reason\) not between 3 and 160/i,'motivo do estorno precisa ser validado');
need(/from public\.padoka_sales[\s\S]*for update/i,'venda precisa ser bloqueada antes do estorno');
need(/if v_sale\.status = 'voided'[\s\S]*return v_sale/i,'retry de estorno precisa ser idempotente');
need(/from public\.padoka_sale_items[\s\S]*for update of i/i,'linhas de estoque precisam ser bloqueadas antes da devolução');
need(/quantity = i\.quantity \+ g\.quantity/i,'estorno precisa devolver estoque na mesma transação');
need(/insert into public\.padoka_inventory_movements/i,'estorno precisa registrar movimento de estoque');
need(/'sale',[\s\n\r]*v_sale\.id/i,'movimento precisa referenciar a venda original');
need(/set status = 'voided'/i,'venda precisa ser marcada como estornada');
need(/voided_by = auth\.uid\(\)/i,'estorno precisa registrar o responsável');
need(/voided_at = now\(\)/i,'estorno precisa registrar horário');
need(/void_reason = v_reason/i,'estorno precisa guardar o motivo validado');
need(/revoke all on function public\.padoka_void_sale\(uuid,text\) from public, anon/i,'RPC não pode ser executável por anon/public');
need(/grant execute on function public\.padoka_void_sale\(uuid,text\) to authenticated/i,'staff autenticado precisa executar a RPC sob validação interna');
forbid(/trigger[^;]*auth\.users/is,'migration não pode criar trigger global em auth.users');
forbid(/grant update.*padoka_sales.*authenticated/i,'frontend não deve receber UPDATE direto em vendas');

if(!process.exitCode)console.log('PDV sale void audit: OK');
