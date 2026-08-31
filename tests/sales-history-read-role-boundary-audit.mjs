import fs from 'node:fs';

const migration=fs.readFileSync('supabase/066_sales_history_read_role_boundary.sql','utf8');
const pdv=fs.readFileSync('assets/pdv-idempotency.js','utf8');
const voidUi=fs.readFileSync('assets/pdv-sale-void.js','utf8');
const reporting=fs.readFileSync('assets/reporting-sync.js','utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const need=(src,re,m)=>{if(!re.test(src))fail(m)};
const forbid=(src,re,m)=>{if(re.test(src))fail(m)};

need(migration,/alter table public\.padoka_sales enable row level security/i,'padoka_sales precisa manter RLS ativa');
need(migration,/alter table public\.padoka_sale_items enable row level security/i,'padoka_sale_items precisa manter RLS ativa');
need(migration,/revoke all on public\.padoka_sales from anon/i,'anon não pode ler vendas');
need(migration,/revoke all on public\.padoka_sale_items from anon/i,'anon não pode ler itens de venda');
need(migration,/padoka_staff_has_role\(array\['owner','manager'\]::text\[\]\)/i,'histórico de vendas precisa ficar restrito à gerência');
forbid(migration,/padoka_is_staff\(\)/i,'policy não pode voltar a aceitar qualquer staff');
forbid(migration,/'cashier'|'attendant'|'stock'|'production'/i,'policy de histórico não pode incluir papéis operacionais');
forbid(migration,/grant\s+(insert|update|delete).*authenticated/is,'migration não pode ampliar escrita direta de vendas');

need(pdv,/sb\.rpc\('padoka_list_product_barcodes'\)/i,'Caixa deve testar capability por RPC autorizada');
forbid(pdv,/from\('padoka_sales'\)\.select\('request_id'\)/i,'Caixa não pode depender de leitura direta do histórico');
need(voidUi,/function canVoid[\s\S]*\['owner','manager'\]/i,'histórico/estorno direto deve permanecer limitado à gerência no runtime');
need(reporting,/const allowedRoles=new Set\(\['owner','manager'\]\)/i,'relatórios financeiros devem permanecer limitados à gerência');
need(reporting,/sb\.rpc\('padoka_report_summary'/i,'relatório consolidado deve continuar server-authoritative');

if(!process.exitCode)console.log('Sales history read role boundary audit: OK');
