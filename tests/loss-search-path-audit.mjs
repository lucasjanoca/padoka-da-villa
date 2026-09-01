import fs from 'node:fs';

const migration=fs.readFileSync('supabase/080_loss_search_path_hardening.sql','utf8');
const privateBoundary=fs.readFileSync('supabase/040_private_rpc_implementations.sql','utf8');
const loss=fs.readFileSync('supabase/007_loss_idempotency.sql','utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const need=(r,text,m)=>{if(!r.test(text))fail(m)};

need(/alter function padoka_private\.padoka_register_loss_once\(text, numeric, text, text, uuid\)[\s\S]*set search_path\s*=\s*''/i,migration,'privileged loss implementation must use an empty search_path');
need(/create function public\.padoka_register_loss_once[\s\S]*security invoker[\s\S]*set search_path\s*=\s*''[\s\S]*padoka_private\.padoka_register_loss_once/i,privateBoundary,'public loss RPC must remain a SECURITY INVOKER wrapper');
need(/padoka_staff_has_role\(array\['owner','manager','stock','production'\]\)/i,loss,'loss registration must remain restricted to approved staff roles');
need(/p_request_id is null[\s\S]*loss request id required/i,loss,'loss registration must keep request_id idempotency enforcement');
need(/public\.padoka_inventory[\s\S]*for update/i,loss,'loss registration must keep the inventory row lock');
if(/grant execute on function public\.padoka_register_loss_once\(text, numeric, text, text, uuid\) to anon/i.test(privateBoundary))fail('anonymous users must not receive loss RPC execution');

if(!process.exitCode)console.log('Loss search_path audit: OK');
