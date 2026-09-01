import fs from 'node:fs';

const nav=fs.readFileSync('assets/internal-nav.js','utf8');
const internal=fs.readFileSync('internal.html','utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const need=(src,re,m)=>{if(!re.test(src))fail(m)};
const forbid=(src,re,m)=>{if(re.test(src))fail(m)};

need(nav,/PADOKA_SUPABASE_ORIGIN=['"]https:\/\/yncspxfsvlqdnodlsosb\.supabase\.co['"]/,'navegação interna precisa fixar a origem Supabase da PADOKA');
need(nav,/new URL\(String\(url\|\|['"]{2}\)\)\.origin/,'pinning precisa normalizar e validar a origem solicitada');
need(nav,/if\(origin!==PADOKA_SUPABASE_ORIGIN\)throw new Error\(['"]PADOKA backend mismatch['"]\)/,'backend inesperado precisa falhar fechado antes de criar o client');
need(nav,/originalCreateClient\(PADOKA_SUPABASE_ORIGIN,key,options\)/,'client interno precisa sempre ser criado com a origem PADOKA fixada');
need(nav,/__padokaBackendPinned/,'wrapper precisa ser instalado uma única vez');
need(internal,/<script src=["']assets\/internal-nav\.js["']><\/script><script>/,'guard de backend precisa executar antes do bootstrap inline do painel');
need(internal,/createClient\(c\.url,c\.publishableKey/,'teste cobre explicitamente o bootstrap legado que depende do guard central');
forbid(nav,/infotech|service_role|sb_secret_/i,'guard do navegador não pode referenciar backend InfoTech ou segredo administrativo');

if(!process.exitCode)console.log('Internal backend pinning audit: OK');
