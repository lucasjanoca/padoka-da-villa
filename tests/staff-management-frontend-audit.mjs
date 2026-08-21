import fs from 'node:fs';

const ui=fs.readFileSync('assets/staff-management.js','utf8');
const nav=fs.readFileSync('assets/internal-nav.js','utf8');
const sql=fs.readFileSync('supabase/014_staff_management_rpc.sql','utf8');
const fail=message=>{throw new Error(message)};
const expect=(condition,message)=>{if(!condition)fail(message)};

expect(nav.includes("equipe:['owner']"),'Navegação deve classificar Equipe como módulo exclusivo de owner.');
expect(nav.includes("s.src='assets/staff-management.js'"),'Gestão deve carregar o módulo condicional de equipe.');
expect(ui.includes("context.role!=='owner'"),'Frontend deve recusar funções diferentes de owner antes de montar a interface.');
expect(ui.includes("client.rpc('padoka_list_staff')"),'Frontend deve listar equipe somente pela RPC protegida.');
expect(ui.includes("client.rpc('padoka_update_staff'"),'Frontend deve alterar função/estado somente pela RPC protegida.');
expect(!/\.from\(['"]padoka_staff_users['"]\)\.(insert|update|upsert|delete)/.test(ui),'Frontend não pode escrever diretamente em padoka_staff_users.');
expect(ui.includes("missingRpc(error)")&&ui.includes("location.replace('gestao.html?tab=configuracoes')"),'Migration ausente deve manter fallback seguro sem aba quebrada.');
expect(ui.includes("row.user_id===currentUserId")&&ui.includes("self?'disabled':''"),'Owner deve ter proteção visual contra remover o próprio acesso.');
expect(ui.includes("padoka-staff-management-ui")&&ui.includes("table:'padoka_staff_users'"),'Lista de equipe deve receber atualização Realtime.');
expect(ui.includes('const esc=value=>')&&ui.includes("esc(row.display_name")&&ui.includes("esc(row.email||row.user_id)"),'Nome/e-mail vindos do servidor devem ser escapados antes de innerHTML.');
expect(sql.includes('join auth.users u on u.id = s.user_id'),'RPC owner-only deve resolver identificação do staff na origem Auth sem criar perfil PADOKA automático.');
expect(sql.includes('display_name text')&&sql.includes('email text'),'Listagem deve retornar identificação suficiente para a tela interna.');
expect(!/create\s+trigger[\s\S]{0,500}?\bon\s+auth\.users\b/i.test(sql),'Gestão de equipe não pode criar trigger global em auth.users.');

console.log('staff-management-frontend-audit: ok');
