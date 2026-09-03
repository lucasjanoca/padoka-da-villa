import fs from 'node:fs';

const migration=fs.readFileSync('supabase/087_padoka_loyalty_redemption_idempotency.sql','utf8');
const runtime=fs.readFileSync('assets/club.js','utf8');

function requireMatch(source,re,label){
  if(!re.test(source))throw new Error(`Missing ${label}`);
}
function forbid(source,re,label){
  if(re.test(source))throw new Error(`Forbidden ${label}`);
}

requireMatch(migration,/add column if not exists request_id uuid/i,'loyalty request_id column');
requireMatch(migration,/create unique index if not exists padoka_loyalty_redemptions_user_request_uidx[\s\S]*?\(user_id, request_id\)[\s\S]*?where request_id is not null/i,'per-customer request uniqueness');
requireMatch(migration,/create or replace function padoka_rpc_private\.redeem_reward_once\([\s\S]*?p_request_id uuid[\s\S]*?security definer[\s\S]*?set search_path=''/i,'private idempotent implementation hardening');
requireMatch(migration,/v_uid:=padoka_private\.padoka_loyalty_require_customer\(\)/i,'PADOKA customer onboarding authorization');
requireMatch(migration,/where r\.user_id=v_uid\s+and r\.request_id=p_request_id/i,'idempotency replay lookup bound to customer');
requireMatch(migration,/if v_existing\.reward_id<>p_reward_id then[\s\S]*?request id conflict/i,'request fingerprint conflict protection');
requireMatch(migration,/for update/i,'transaction row locking');
requireMatch(migration,/request_id\s*\)[\s\S]*?p_request_id/i,'request id persisted with redemption');
requireMatch(migration,/create or replace function public\.padoka_redeem_reward_once\([\s\S]*?security invoker[\s\S]*?set search_path=''/i,'public SECURITY INVOKER wrapper');
requireMatch(migration,/revoke all on function public\.padoka_redeem_reward_once\(uuid,uuid\)[\s\S]*?from public,anon,authenticated;[\s\S]*?grant execute on function public\.padoka_redeem_reward_once\(uuid,uuid\)[\s\S]*?to authenticated;/i,'public wrapper least privilege ACL');
requireMatch(migration,/revoke execute on function public\.padoka_redeem_reward\(uuid\)[\s\S]*?from public,anon,authenticated;/i,'legacy non-idempotent RPC disabled');

requireMatch(runtime,/EXPECTED_PROJECT_REF='yncspxfsvlqdnodlsosb'/,'correct PADOKA backend');
requireMatch(runtime,/sessionStorage\.getItem\(key\)/,'retry request restored from session storage');
requireMatch(runtime,/crypto\.randomUUID\(\)/,'cryptographically random request id');
requireMatch(runtime,/sessionStorage\.setItem\(key,requestId\)/,'retry request persisted before mutation');
requireMatch(runtime,/sb\.rpc\('padoka_redeem_reward_once',\{\s*p_reward_id:rewardId,\s*p_request_id:attempt\.requestId\s*\}\)/,'idempotent loyalty RPC runtime call');
requireMatch(runtime,/if\(!await ensureSession\(expectedUserId,epoch\)\)return;[\s\S]*?padoka_redeem_reward_once/,'session revalidation before redemption');
requireMatch(runtime,/clearRedemptionRequest\(attempt\.key\);[\s\S]*?closeRedeem\(\)/,'request cleared only after successful RPC');
forbid(runtime,/sb\.rpc\('padoka_redeem_reward'\s*,/,'legacy non-idempotent redemption runtime call');
forbid(runtime,/service_role|sb_secret_/i,'secret/service role in customer runtime');
forbid(runtime,/auth\.users/i,'global auth.users coupling in customer runtime');

console.log('Loyalty redemption idempotency audit passed.');
