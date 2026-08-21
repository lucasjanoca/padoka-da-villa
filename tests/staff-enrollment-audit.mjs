import fs from 'node:fs';

const sql=fs.readFileSync('supabase/015_staff_enrollment_rpc.sql','utf8');
const code=sql.replace(/^\s*--.*$/gm,'');
const expect=(condition,message)=>{if(!condition)throw new Error(message)};

expect(sql.includes('Sites De Clientes! (yncspxfsvlqdnodlsosb)'),'Migration deve declarar o backend correto da PADOKA.');
expect(sql.includes('padoka_add_staff_by_email'),'Migration deve criar RPC explícita de inclusão de staff por e-mail.');
expect(sql.includes("padoka_staff_has_role(array['owner'])"),'Somente owner pode incluir funcionário.');
expect(sql.includes("p_role not in ('owner','manager','cashier','attendant','production','stock')"),'A função deve aceitar somente papéis PADOKA conhecidos.');
expect(/from\s+auth\.users\s+u/i.test(code)&&/lower\(u\.email\)\s*=\s*v_email/i.test(code),'A identidade alvo deve ser resolvida por e-mail exato em auth.users.');
expect(sql.includes('auth user not found'),'A RPC não pode criar identidade Auth silenciosamente.');
expect(sql.includes('padoka staff already exists'),'A RPC deve impedir cadastro interno duplicado.');
expect(/insert\s+into\s+public\.padoka_staff_users/i.test(code),'Inclusão deve ocorrer apenas em padoka_staff_users.');
expect(!/insert\s+into\s+public\.padoka_profiles/i.test(code),'Incluir staff não pode criar perfil de cliente PADOKA.');
expect(!/\b(insert|update|delete)\s+(?:into\s+)?auth\./i.test(code),'Migration não pode escrever diretamente no schema auth.');
expect(!/create\s+trigger[\s\S]{0,500}?\bon\s+auth\.users\b/i.test(code),'Migration não pode criar trigger global em auth.users.');
expect(/security\s+definer/i.test(code)&&/set\s+search_path\s*=\s*public/i.test(code),'RPC SECURITY DEFINER deve fixar search_path=public.');
expect(/revoke\s+all\s+on\s+function\s+public\.padoka_add_staff_by_email\(text,text\)\s+from\s+public\s*,\s*anon/i.test(code),'RPC não pode ficar executável por public/anon.');
expect(/grant\s+execute\s+on\s+function\s+public\.padoka_add_staff_by_email\(text,text\)\s+to\s+authenticated/i.test(code),'Authenticated deve executar a RPC, que revalida owner no servidor.');

console.log('staff-enrollment-audit: ok');
