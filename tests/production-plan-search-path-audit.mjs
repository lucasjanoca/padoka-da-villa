import fs from 'node:fs';

const migration=fs.readFileSync('supabase/076_production_plan_search_path_hardening.sql','utf8');
const operational=fs.readFileSync('assets/operational-sync.js','utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const need=(r,text,m)=>{if(!r.test(text))fail(m)};

need(/alter function padoka_private\.padoka_upsert_production_plan\(date, text, numeric, text\)[\s\S]*set search_path\s*=\s*''/i,migration,'production-plan private implementation must use an empty search_path');
need(/sb\.rpc\('padoka_upsert_production_plan'/,operational,'production planning UI must continue using the server-authoritative RPC');
if(/\.from\('padoka_production_plans'\)[\s\S]{0,220}\.(insert|upsert|update|delete)\(/i.test(operational))fail('production planning UI must not mutate padoka_production_plans directly');

if(!process.exitCode)console.log('Production plan search_path audit: OK');
