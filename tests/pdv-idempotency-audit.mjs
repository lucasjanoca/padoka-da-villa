import fs from 'node:fs';

const sql=fs.readFileSync('supabase/010_pdv_sale_idempotency.sql','utf8');
const ui=fs.readFileSync('assets/pdv-idempotency.js','utf8');
const nav=fs.readFileSync('assets/internal-nav.js','utf8');
const fail=(m)=>{console.error('FAIL:',m);process.exitCode=1};
const need=(src,re,m)=>{if(!re.test(src))fail(m)};
const forbid=(src,re,m)=>{if(re.test(src))fail(m)};

need(sql,/add column if not exists request_id uuid/i,'padoka_sales precisa de request_id');
need(sql,/create unique index if not exists padoka_sales_request_id_uidx/i,'request_id precisa de unicidade');
need(sql,/create or replace function public\.padoka_create_sale_once/i,'faltou RPC idempotente do PDV');
need(sql,/padoka_staff_has_role\(array\['owner','manager','cashier','attendant'\]\)/i,'RPC precisa restringir perfis do Caixa');
need(sql,/pg_advisory_xact_lock\(hashtextextended\(p_request_id::text,0\)\)/i,'retry concorrente precisa ser serializado por request_id');
need(sql,/where request_id = p_request_id/i,'RPC precisa procurar venda existente por request_id');
need(sql,/sale request id conflict/g,'request_id reutilizado com payload diferente precisa falhar');
need(sql,/cashier_user_id is distinct from auth\.uid\(\)/i,'idempotência precisa validar o operador original');
need(sql,/payment_method is distinct from p_payment_method/i,'idempotência precisa validar forma de pagamento');
need(sql,/v_existing_items.*is distinct from.*v_request_items/is,'idempotência precisa validar os itens originais');
need(sql,/for update of i/i,'estoque precisa ser bloqueado antes da baixa');
need(sql,/quantity\s*=\s*i\.quantity\s*-\s*req\.quantity/i,'venda precisa baixar estoque na transação');
need(sql,/'sale',v_sale\.id/i,'movimento de estoque precisa referenciar a venda');
need(sql,/revoke all on function public\.padoka_create_sale_once\(jsonb,text,uuid\) from public, anon/i,'RPC não pode ser executável por anon/public');
need(sql,/grant execute on function public\.padoka_create_sale_once\(jsonb,text,uuid\) to authenticated/i,'staff autenticado precisa executar a RPC sob validação interna');
forbid(sql,/create\s+trigger[\s\S]{0,300}\bon\s+auth\.users\b/i,'migration não pode criar trigger global em auth.users');
forbid(sql,/grant (insert|update|delete).*padoka_sales.*authenticated/i,'frontend não deve escrever vendas diretamente');

need(nav,/assets\/pdv-idempotency\.js/i,'PDV precisa carregar a camada idempotente somente na área interna');
need(ui,/padoka_pdv_pending_sale_v1/i,'frontend precisa persistir tentativa ambígua em sessionStorage');
need(ui,/padoka_create_sale_once/i,'frontend precisa usar a RPC idempotente quando a migration 010 existir');
need(ui,/p_request_id:op\.request_id/i,'frontend precisa reutilizar o mesmo request_id no retry');
need(ui,/sessionStorage\.setItem/i,'retry ambíguo precisa preservar a tentativa');
need(ui,/Tentar novamente/i,'interface precisa oferecer retry explícito');
need(ui,/Venda aguardando confirmação do servidor/i,'interface precisa explicar estado ambíguo sem simular sucesso');
need(ui,/select\('request_id'\)/i,'camada só deve assumir o PDV quando a migration 010 estiver disponível');
forbid(ui,/localStorage/i,'tentativa idempotente não deve virar venda local persistida');
forbid(ui,/from\(['"]padoka_inventory['"]\).*\.(update|insert|delete)/is,'frontend não pode alterar estoque diretamente');

if(!process.exitCode)console.log('PDV idempotency audit: OK');
