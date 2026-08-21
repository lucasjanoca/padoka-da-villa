import fs from 'node:fs';

const sql = fs.readFileSync('supabase/018_product_catalog_audit.sql','utf8');
const code = sql.replace(/^\s*--.*$/gm,'');
const fail = message => { console.error(`❌ ${message}`); process.exitCode = 1; };
const ok = message => console.log(`✓ ${message}`);
const expect = (re,message) => re.test(code) ? ok(message) : fail(message);

expect(/create\s+table\s+if\s+not\s+exists\s+public\.padoka_product_audit/i,'cria padoka_product_audit');
expect(/alter\s+table\s+public\.padoka_product_audit\s+enable\s+row\s+level\s+security/i,'RLS habilitado na auditoria');
expect(/revoke\s+all\s+on\s+public\.padoka_product_audit\s+from\s+anon\s*,\s*authenticated/i,'sem acesso direto à tabela de auditoria');
expect(/create\s+or\s+replace\s+function\s+public\.padoka_save_product/i,'padoka_save_product passa a auditar alterações');
expect(/create\s+or\s+replace\s+function\s+public\.padoka_list_product_audit/i,'cria RPC de leitura da auditoria');
expect(/padoka_staff_has_role\(array\['owner','manager'\]\)/i,'auditoria restrita a owner/manager');
expect(/select\s+\*\s+into\s+v_before[\s\S]*?for\s+update/i,'alteração serializa o produto antes de auditar');
expect(/values\(v_result\.id,'added',null,/i,'novo produto registra evento added');
expect(/v_changed\s*:=/i,'mudança efetiva é detectada');
expect(/if\s+v_changed\s+then[\s\S]*?'updated'/i,'salvamento sem alteração não cria evento vazio');
expect(/before_state\s+jsonb/i,'guarda estado anterior');
expect(/after_state\s+jsonb\s+not\s+null/i,'guarda estado posterior');
expect(/actor_user_id\s+uuid\s+references\s+auth\.users/i,'registra autor da alteração sem trigger global');
expect(/least\(greatest\(coalesce\(p_limit,50\),1\),100\)/i,'limita leitura do histórico a no máximo 100 eventos');
expect(/revoke\s+all\s+on\s+function\s+public\.padoka_list_product_audit\(integer\)\s+from\s+public\s*,\s*anon/i,'RPC não é pública/anon');
expect(/grant\s+execute\s+on\s+function\s+public\.padoka_list_product_audit\(integer\)\s+to\s+authenticated/i,'RPC disponível apenas para sessão autenticada, com role validado dentro');

if (/create\s+trigger[\s\S]{0,500}?\bon\s+auth\.users\b/i.test(code)) fail('não pode criar trigger global em auth.users');
else ok('sem trigger global em auth.users');

if (/\bgrant\b[\s\S]{0,200}?\bto\s+anon\b/i.test(code)) fail('migration interna não pode conceder privilégios ao anon');
else ok('sem grant interno para anon');

if (!process.exitCode) console.log('\nPADOKA product audit trail audit OK.');