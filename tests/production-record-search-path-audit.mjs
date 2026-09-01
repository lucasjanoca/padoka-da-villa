import fs from 'node:fs';

const migration=fs.readFileSync('supabase/079_production_record_search_path_hardening.sql','utf8');
const privateBoundary=fs.readFileSync('supabase/040_private_rpc_implementations.sql','utf8');
const production=fs.readFileSync('supabase/006_production_completion_transaction.sql','utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const need=(r,text,m)=>{if(!r.test(text))fail(m)};

need(/alter function padoka_private\.padoka_record_production\(uuid, numeric, uuid\)[\s\S]*set search_path\s*=\s*''/i,migration,'privileged production implementation must use an empty search_path');
need(/create function public\.padoka_record_production[\s\S]*security invoker[\s\S]*set search_path\s*=\s*''[\s\S]*padoka_private\.padoka_record_production/i,privateBoundary,'public production RPC must remain a SECURITY INVOKER wrapper');
need(/padoka_staff_has_role\(array\['owner','manager','production'\]\)/i,production,'production completion must remain restricted to approved staff roles');
need(/p_request_id is null[\s\S]*production request id required/i,production,'production completion must keep request_id idempotency enforcement');
if(/grant execute on function public\.padoka_record_production\(uuid, numeric, uuid\) to anon/i.test(privateBoundary))fail('anonymous users must not receive production RPC execution');

if(!process.exitCode)console.log('Production record search_path audit: OK');
