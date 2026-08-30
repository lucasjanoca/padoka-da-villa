import fs from 'node:fs';

const migration=fs.readFileSync('supabase/053_future_default_privileges_hardening.sql','utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const need=(re,m)=>{if(!re.test(migration))fail(m)};

need(/revoke create on schema public from public/i,'Supabase defaults: CREATE público não foi revogado');
need(/revoke create on schema public from anon, authenticated/i,'Supabase defaults: CREATE de client roles não foi revogado');
need(/alter default privileges in schema public[\s\S]*revoke all on tables from anon, authenticated/i,'Supabase defaults: tabelas futuras ainda podem ganhar privilégio');
need(/alter default privileges in schema public[\s\S]*revoke all on sequences from anon, authenticated/i,'Supabase defaults: sequências futuras ainda podem ganhar privilégio');
need(/revoke execute on functions from public, anon, authenticated/i,'Supabase defaults: funções futuras ainda podem ficar executáveis');

if(!process.exitCode)console.log('Supabase future default privileges audit: OK');
