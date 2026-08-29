import fs from 'node:fs';

const sql=fs.readFileSync('supabase/016_staff_audit_trail.sql','utf8');
const js=fs.readFileSync('assets/staff-audit.js','utf8');
const nav=fs.readFileSync('assets/internal-nav.js','utf8');
const fail=message=>{throw new Error(message)};
const expect=(condition,message)=>{if(!condition)fail(message)};
const code=sql.replace(/^\s*--.*$/gm,'');

expect(sql.includes('Sites De Clientes! (yncspxfsvlqdnodlsosb)'),'Migration deve declarar o backend correto da PADOKA.');
expect(sql.includes('create table if not exists public.padoka_staff_audit'),'Migration deve criar tabela de auditoria isolada por padoka_.');
expect(sql.includes("action in ('added','updated')"),'Auditoria deve limitar tipos de evento conhecidos.');
expect(sql.includes("padoka_staff_has_role(array['owner'])"),'Leitura do histórico deve exigir owner.');
expect(/revoke\s+insert\s*,\s*update\s*,\s*delete\s+on\s+public\.padoka_staff_audit\s+from\s+authenticated/i.test(code),'Authenticated não pode escrever diretamente na auditoria.');
expect(sql.includes("pg_advisory_xact_lock(hashtext('padoka_staff_owner_guard'))"),'Alterações administrativas devem serializar a proteção do último owner.');
expect(sql.includes("'updated'")&&sql.includes("'added'"),'RPCs de alteração e inclusão devem registrar eventos.');
expect(sql.includes('padoka_list_staff_audit'),'Migration deve expor RPC de leitura do histórico.');
expect(/revoke\s+all\s+on\s+function\s+public\.padoka_list_staff_audit\(integer\)\s+from\s+public\s*,\s*anon/i.test(code),'RPC do histórico não pode ser pública/anon.');
expect(!/create\s+trigger[\s\S]{0,500}?\bon\s+auth\.users\b/i.test(code),'Migration não pode criar trigger global em auth.users.');
expect(!/\b(insert|update|delete)\s+(?:into\s+)?auth\./i.test(code),'Migration não pode escrever diretamente em auth.*.');

expect(js.includes("window.padokaStaffRole")&&js.includes("context.role!=='owner'"),'Frontend do histórico deve depender do papel owner já validado.');
expect(js.includes("client.rpc('padoka_list_staff_audit'"),'Frontend deve carregar o histórico exclusivamente pela RPC.');
expect(!/\.from\(['"]padoka_staff_audit['"]\)\.(insert|update|delete|upsert)/.test(js),'Frontend não pode escrever diretamente na tabela de auditoria.');
expect(js.includes('esc(value')||js.includes('const esc='),'Frontend deve sanitizar textos antes de renderizar.');
expect(js.includes('missingRpc')&&js.includes("document.getElementById('staffAudit')?.remove()"),'Frontend deve sumir com segurança quando a migration 016 ainda não existir.');
expect(nav.includes("s.src='assets/staff-audit.js'"),'Navegação interna deve carregar o módulo de auditoria somente na Gestão.');

expect(js.includes('onAuthStateChange'),'Área Equipe deve reagir a logout/troca de identidade sem depender de reload manual.');
expect(js.includes('clearTeamUi()')&&js.includes("document.querySelector('[data-panel=\"equipe\"]')?.remove()"),'Troca de identidade deve remover imediatamente a interface sensível de equipe.');
expect(js.includes("location.replace('internal.html')"),'Troca/logout na área Equipe deve retornar para o guard interno antes de qualquer nova exibição.');
expect(js.includes('lifecycleEpoch')&&js.includes('activeUserId'),'Respostas assíncronas antigas devem ser vinculadas ao ciclo e à identidade que iniciou a consulta.');
expect(js.includes('sessionStillValid(epoch,userId)'),'Resultado da auditoria só pode ser renderizado se a mesma sessão owner continuar válida.');
expect(js.includes("classList.contains('padoka-staff-pending')"),'Histórico não pode reativar enquanto o guard global de staff estiver pendente.');
expect(!/onAuthStateChange\(async/.test(js),'Callback de onAuthStateChange não deve executar trabalho assíncrono diretamente.');

expect(js.includes('async function safeSession()'),'Histórico deve centralizar a leitura segura da sessão.');
expect(/safeSession\(\)[\s\S]*?try\s*\{[\s\S]*?client\.auth\.getSession\(\)[\s\S]*?catch\s*\(/.test(js),'Leitura da sessão deve capturar rejeição de transporte do Supabase Auth.');
expect(js.includes('async function confirmSession(epoch,userId)'),'Histórico deve reconfirmar a sessão antes de aplicar respostas assíncronas.');
expect(js.includes('if(!await confirmSession(epoch,userId))'),'RPCs do histórico devem falhar fechado quando a sessão não puder ser reconfirmada.');
expect(js.includes('const session=await safeSession();'),'Inicialização não pode usar getSession sem tratamento fail-closed.');
expect(!/const\s*\{\s*data\s*:\s*\{\s*session\s*\}\s*\}\s*=\s*await\s+client\.auth\.getSession\(\)/.test(js),'Inicialização não deve manter leitura direta de sessão fora do helper seguro.');

console.log('staff-audit-trail-audit: ok');
