import fs from 'node:fs';

const source=fs.readFileSync('assets/staff-audit.js','utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const need=(re,m)=>{if(!re.test(source))fail(m)};
const forbid=(re,m)=>{if(re.test(source))fail(m)};

need(/PADOKA_SUPABASE_URL=['"]https:\/\/yncspxfsvlqdnodlsosb\.supabase\.co['"]/,'histórico de staff precisa fixar o backend correto da PADOKA');
need(/isPadokaClient=candidate=>String\(candidate\?\.supabaseUrl\|\|['"]{2}\)\.replace\(\/\\\/\+\$\/,["']{2}\)===PADOKA_SUPABASE_URL/,'histórico de staff precisa validar localmente a origem do client');
need(/if\(isPadokaClient\(window\.padokaSupabase\)&&window\.padokaStaffRole\)return \{client:window\.padokaSupabase,role:window\.padokaStaffRole\}/,'client de outro projeto deve ser rejeitado antes de Auth ou RPC');
need(/context\.role!==['"]owner['"]/,'histórico de staff deve continuar restrito ao proprietário');
need(/client\.rpc\(['"]padoka_list_staff_audit['"]/, 'histórico deve continuar usando RPC server-authoritative');
forbid(/service_role|sb_secret_|infotech/i,'frontend do histórico não pode referenciar segredo administrativo ou backend InfoTech');

if(!process.exitCode)console.log('Staff audit backend isolation audit: OK');
