import fs from 'node:fs';

const sql=fs.readFileSync('supabase/014_staff_management_rpc.sql','utf8');
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

console.log('staff-management-audit: ok');
