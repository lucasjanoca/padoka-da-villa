import fs from 'node:fs';

const migration=fs.readFileSync('supabase/078_pdv_sale_once_search_path_hardening.sql','utf8');
const pdv=fs.readFileSync('assets/pdv-idempotency.js','utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const need=(r,text,m)=>{if(!r.test(text))fail(m)};

need(/alter function padoka_private\.padoka_create_sale_once\(jsonb, text, uuid\)[\s\S]*set search_path\s*=\s*''/i,migration,'idempotent PDV sale implementation must use an empty search_path');
need(/sb\.rpc\('padoka_create_sale_once'/,pdv,'PDV must continue using the idempotent server-authoritative sale RPC');
if(/sb\.rpc\('padoka_create_sale'\s*,/i.test(pdv))fail('PDV must not fall back to the legacy non-idempotent sale RPC');
if(/\.from\('padoka_(sales|sale_items|inventory|inventory_movements)'\)[\s\S]{0,220}\.(insert|upsert|update|delete)\(/i.test(pdv))fail('PDV must not mutate sale or inventory tables directly');

if(!process.exitCode)console.log('PDV sale search_path audit: OK');
