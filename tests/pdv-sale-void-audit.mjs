import fs from 'node:fs';

const sql=fs.readFileSync('supabase/012_pdv_sale_void_transaction.sql','utf8');
const js=fs.readFileSync('assets/pdv-sale-void.js','utf8');
const nav=fs.readFileSync('assets/internal-nav.js','utf8');
const fail=(m)=>{console.error('FAIL:',m);process.exitCode=1};
const need=(text,re,m)=>{if(!re.test(text))fail(m)};
const forbid=(text,re,m)=>{if(re.test(text))fail(m)};

need(sql,/add column if not exists void_reason text/i,'padoka_sales precisa registrar motivo do estorno');
need(sql,/create or replace function public\.padoka_void_sale/i,'faltou RPC transacional de estorno');
need(sql,/padoka_staff_has_role\(array\['owner','manager'\]\)/i,'estorno precisa ficar restrito a owner/manager');
need(sql,/char_length\(v_reason\) not between 3 and 160/i,'motivo do estorno precisa ser validado');
need(sql,/from public\.padoka_sales[\s\S]*for update/i,'venda precisa ser bloqueada antes do estorno');
need(sql,/if v_sale\.status = 'voided'[\s\S]*return v_sale/i,'retry de estorno precisa ser idempotente');
need(sql,/from public\.padoka_sale_items[\s\S]*for update of i/i,'linhas de estoque precisam ser bloqueadas antes da devolução');
need(sql,/quantity = i\.quantity \+ g\.quantity/i,'estorno precisa devolver estoque na mesma transação');
need(sql,/insert into public\.padoka_inventory_movements/i,'estorno precisa registrar movimento de estoque');
need(sql,/'sale',[\s\n\r]*v_sale\.id/i,'movimento precisa referenciar a venda original');
need(sql,/set status = 'voided'/i,'venda precisa ser marcada como estornada');
need(sql,/voided_by = auth\.uid\(\)/i,'estorno precisa registrar o responsável');
need(sql,/voided_at = now\(\)/i,'estorno precisa registrar horário');
need(sql,/void_reason = v_reason/i,'estorno precisa guardar o motivo validado');
need(sql,/revoke all on function public\.padoka_void_sale\(uuid,text\) from public, anon/i,'RPC não pode ser executável por anon/public');
need(sql,/grant execute on function public\.padoka_void_sale\(uuid,text\) to authenticated/i,'staff autenticado precisa executar a RPC sob validação interna');
forbid(sql,/trigger[^;]*auth\.users/is,'migration não pode criar trigger global em auth.users');
forbid(sql,/grant update.*padoka_sales.*authenticated/i,'frontend não deve receber UPDATE direto em vendas');

need(js,/\['owner','manager'\]\.includes/i,'frontend de estorno precisa ficar restrito a owner/manager');
need(js,/typeof staffRole==='undefined'\?'':staffRole/i,'frontend deve ler o binding staffRole compartilhado pelo PDV');
forbid(js,/globalThis\.staffRole/i,'staffRole declarado com let não deve ser lido como propriedade de globalThis');
need(js,/from\('padoka_sales'\)\.select\('id,void_reason'\)/i,'frontend só deve ativar quando a migration 012 estiver disponível');
need(js,/rpc\('padoka_void_sale'/i,'frontend deve usar a RPC transacional de estorno');
need(js,/from\('padoka_sale_items'\)\.select/i,'detalhes da venda devem vir da tabela protegida de itens');
need(js,/postgres_changes[\s\S]*padoka_sales/i,'histórico de vendas deve atualizar por Realtime');
need(js,/reason\.length<3\|\|reason\.length>160/i,'frontend deve validar o motivo antes da RPC');
need(nav,/assets\/pdv-sale-void\.js/i,'PDV precisa carregar o módulo de estorno');
forbid(js,/localStorage/i,'estorno não deve depender de localStorage');
forbid(js,/\.from\('padoka_sales'\)\.update/i,'frontend não pode atualizar vendas diretamente');
forbid(js,/\.from\('padoka_inventory'\)\.(update|insert|upsert)/i,'frontend não pode devolver estoque diretamente');

if(!process.exitCode)console.log('PDV sale void audit: OK');
