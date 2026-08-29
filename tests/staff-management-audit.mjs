import fs from 'node:fs';

const sql=fs.readFileSync('supabase/014_staff_management_rpc.sql','utf8');
const nav=fs.readFileSync('assets/internal-nav.js','utf8');
const lifecycle=fs.readFileSync('assets/staff-management-lifecycle.js','utf8');
const staffAudit=fs.readFileSync('assets/staff-audit.js','utf8');
const fail=message=>{throw new Error(message)};
const expect=(condition,message)=>{if(!condition)fail(message)};
const code=sql.replace(/^\s*--.*$/gm,'');

expect(sql.includes('Sites De Clientes! (yncspxfsvlqdnodlsosb)'),'Migration deve declarar explicitamente o backend correto da PADOKA.');
expect(sql.includes('padoka_list_staff'),'Migration deve criar RPC de listagem de staff.');
expect(sql.includes('padoka_update_staff'),'Migration deve criar RPC de atualização de staff.');
expect((sql.match(/padoka_staff_has_role\(array\['owner'\]\)/g)||[]).length>=2,'Listagem e alteração devem exigir owner.');
expect(sql.includes("p_role not in ('owner','manager','cashier','attendant','production','stock')"),'RPC deve aceitar somente funções internas conhecidas.');
expect(sql.includes("p_user_id = auth.uid()")&&sql.includes('owner cannot remove own access'),'Owner não deve conseguir remover o próprio acesso por engano.');
expect(sql.includes("v_current.role = 'owner'")&&sql.includes("where role = 'owner' and active = true")&&sql.includes('cannot remove the last active owner'),'Último owner ativo deve ser protegido.');
expect(sql.includes('for update'),'Alteração de staff deve bloquear a linha alvo durante a transação.');
expect(sql.includes('padoka staff user not found'),'RPC não deve criar funcionário novo silenciosamente.');
expect(sql.includes('user_id = auth.uid()')&&sql.includes("or public.padoka_staff_has_role(array['owner'])"),'RLS de leitura deve limitar staff comum ao próprio cadastro e liberar listagem completa só para owner.');
expect(/revoke\s+insert\s*,\s*update\s*,\s*delete\s+on\s+public\.padoka_staff_users\s+from\s+authenticated/i.test(code),'Escrita direta na tabela de staff deve ser revogada de authenticated.');
expect(/grant\s+execute\s+on\s+function\s+public\.padoka_update_staff\(uuid,text,boolean\)\s+to\s+authenticated/i.test(code),'Authenticated deve executar somente a RPC, que valida owner internamente.');
expect(!/grant[\s\S]{0,180}\bto\s+anon\b/i.test(code),'Migration de staff não pode conceder acesso ao anon.');
expect(!/create\s+trigger[\s\S]{0,500}?\bon\s+auth\.users\b/i.test(code),'Migration de staff não pode criar trigger global em auth.users.');
expect(!sql.includes('InfoTech.io')||sql.includes('NÃO aplicar no projeto InfoTech.io'),'InfoTech.io só pode aparecer na proibição explícita de aplicação.');

expect(nav.includes("assets/staff-management-lifecycle.js"),'Gestão deve carregar o guard dedicado de lifecycle da equipe.');
expect(nav.indexOf('assets/staff-management-lifecycle.js')<nav.indexOf('assets/staff-management.js'),'Guard de lifecycle deve ser carregado antes do módulo de gestão de equipe.');
expect(lifecycle.includes('onAuthStateChange'),'Guard da equipe deve reagir a logout e troca de identidade.');
expect(lifecycle.includes("document.documentElement.classList.add('padoka-staff-pending','padoka-role-pending')"),'Troca de identidade deve ocultar imediatamente a área interna em modo fail-closed.');
expect(lifecycle.includes("document.querySelector('[data-panel=\"equipe\"]')?.remove()"),'Troca de identidade deve remover imediatamente os dados de equipe da identidade anterior.');
expect(lifecycle.includes('padoka-staff-management-ui')&&lifecycle.includes('removeChannel'),'Guard deve encerrar o canal Realtime da gestão de equipe anterior.');
expect(lifecycle.includes("location.replace('internal.html')"),'Logout deve sair da Gestão para o acesso administrativo.');
expect(lifecycle.includes('location.replace(location.href)'),'Troca entre contas autenticadas deve remontar a Gestão sob nova validação de identidade.');
expect(!lifecycle.includes('service_role'),'Guard de frontend nunca pode conter service_role.');

expect(staffAudit.includes("client.rpc('padoka_list_staff_audit',{p_limit:30})"),'Histórico de equipe deve carregar pela RPC server-authoritative.');
expect(staffAudit.includes("client.rpc('padoka_list_staff_audit',{p_limit:1})"),'Probe do histórico deve validar capability pela RPC server-authoritative.');
expect((staffAudit.match(/try\s*\{/g)||[]).length>=2&&(staffAudit.match(/catch\s*\(error\)/g)||[]).length>=2,'Carga e probe do histórico devem capturar rejeições reais de transporte.');
expect(staffAudit.includes('if(!sessionStillValid(epoch,userId))return;'),'Falha de transporte da listagem deve revalidar epoch e identidade antes de alterar a interface.');
expect(staffAudit.includes("button.disabled=false;button.textContent='Atualizar'"),'Falha de transporte deve devolver o botão de atualização ao estado utilizável.');
expect(staffAudit.includes('Verifique a conexão e tente novamente.'),'Histórico deve exibir recuperação amigável quando houver falha de rede.');
expect(!staffAudit.includes('service_role'),'Histórico de equipe nunca pode conter service_role.');

console.log('staff-management-audit: ok');