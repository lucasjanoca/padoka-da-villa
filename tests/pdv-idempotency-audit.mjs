import fs from 'node:fs';

const sql=fs.readFileSync('supabase/010_pdv_sale_idempotency.sql','utf8');
const fail=(m)=>{console.error('FAIL:',m);process.exitCode=1};
const need=(re,m)=>{if(!re.test(sql))fail(m)};
const forbid=(re,m)=>{if(re.test(sql))fail(m)};

need(/add column if not exists request_id uuid/i,'padoka_sales precisa de request_id');
need(/create unique index if not exists padoka_sales_request_id_uidx/i,'request_id precisa de unicidade');
need(/create or replace function public\.padoka_create_sale_once/i,'faltou RPC idempotente do PDV');
need(/padoka_staff_has_role\(array\['owner','manager','cashier','attendant'\]\)/i,'RPC precisa restringir perfis do Caixa');
need(/pg_advisory_xact_lock\(hashtextextended\(p_request_id::text,0\)\)/i,'retry concorrente precisa ser serializado por request_id');
need(/where request_id = p_request_id/i,'RPC precisa procurar venda existente por request_id');
need(/sale request id conflict/g,'request_id reutilizado com payload diferente precisa falhar');
need(/cashier_user_id is distinct from auth\.uid\(\)/i,'idempotência precisa validar o operador original');
need(/payment_method is distinct from p_payment_method/i,'idempotência precisa validar forma de pagamento');
need(/v_existing_items.*is distinct from.*v_request_items/is,'idempotência precisa validar os itens originais');
need(/for update of i/i,'estoque precisa ser bloqueado antes da baixa');
need(/quantity = i\.quantity - r\.quantity/i,'venda precisa baixar estoque na transação');
need(/'sale',v_sale\.id/i,'movimento de estoque precisa referenciar a venda');
need(/revoke all on function public\.padoka_create_sale_once\(jsonb,text,uuid\) from public, anon/i,'RPC não pode ser executável por anon/public');
need(/grant execute on function public\.padoka_create_sale_once\(jsonb,text,uuid\) to authenticated/i,'staff autenticado precisa executar a RPC sob validação interna');
forbid(/trigger[^;]*auth\.users/is,'migration não pode criar trigger global em auth.users');
forbid(/grant (insert|update|delete).*padoka_sales.*authenticated/i,'frontend não deve escrever vendas diretamente');

if(!process.exitCode)console.log('PDV idempotency audit: OK');
