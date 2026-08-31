import fs from 'node:fs';

const migration=fs.readFileSync('supabase/077_inventory_adjustment_search_path_hardening.sql','utf8');
const operational=fs.readFileSync('assets/operational-sync.js','utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const need=(r,text,m)=>{if(!r.test(text))fail(m)};

need(/alter function padoka_private\.padoka_adjust_inventory_once\(text, numeric, text, uuid\)[\s\S]*set search_path\s*=\s*''/i,migration,'inventory adjustment private implementation must use an empty search_path');
need(/sb\.rpc\('padoka_adjust_inventory_once'/,operational,'inventory adjustment UI must continue using the idempotent server-authoritative RPC');
if(/\.from\('padoka_inventory'\)[\s\S]{0,220}\.(insert|upsert|update|delete)\(/i.test(operational))fail('inventory UI must not mutate padoka_inventory directly');
if(/sb\.rpc\('padoka_adjust_inventory'\s*,/i.test(operational))fail('inventory UI must not fall back to the legacy non-idempotent adjustment RPC');

if(!process.exitCode)console.log('Inventory adjustment search_path audit: OK');
