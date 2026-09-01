import fs from 'node:fs';

const migration=fs.readFileSync('supabase/081_report_summary_search_path_hardening.sql','utf8');
const privateBoundary=fs.readFileSync('supabase/040_private_rpc_implementations.sql','utf8');
const report=fs.readFileSync('supabase/008_staff_reporting_rpc.sql','utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const need=(r,text,m)=>{if(!r.test(text))fail(m)};

need(/alter function padoka_private\.padoka_report_summary\(date, date\)[\s\S]*set search_path\s*=\s*''/i,migration,'privileged report summary implementation must use an empty search_path');
need(/create function public\.padoka_report_summary[\s\S]*security invoker[\s\S]*set search_path\s*=\s*''[\s\S]*padoka_private\.padoka_report_summary/i,privateBoundary,'public report summary RPC must remain a SECURITY INVOKER wrapper');
need(/padoka_staff_has_role\(array\['owner','manager'\]\)/i,report,'report summary must remain restricted to owner and manager');
need(/public\.padoka_sales/i,report,'report summary must schema-qualify sales');
need(/public\.padoka_orders/i,report,'report summary must schema-qualify orders');
need(/public\.padoka_losses/i,report,'report summary must schema-qualify losses');
need(/public\.padoka_production_plans/i,report,'report summary must schema-qualify production plans');
need(/public\.padoka_inventory/i,report,'report summary must schema-qualify inventory');
if(/grant execute on function public\.padoka_report_summary\(date, date\) to anon/i.test(privateBoundary))fail('anonymous users must not receive report summary RPC execution');

if(!process.exitCode)console.log('Report summary search_path audit: OK');
