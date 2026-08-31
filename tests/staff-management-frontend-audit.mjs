import fs from 'node:fs';

const ui=fs.readFileSync('assets/staff-management.js','utf8');
const lifecycle=fs.readFileSync('assets/staff-management-lifecycle.js','utf8');
const nav=fs.readFileSync('assets/internal-nav.js','utf8');
const sql=fs.readFileSync('supabase/014_staff_management_rpc.sql','utf8');
const enrollSql=fs.readFileSync('supabase/015_staff_enrollment_rpc.sql','utf8');
const fail=message=>{throw new Error(message)};
const expect=(condition,message)=>{if(!condition)fail(message)};

expect(nav.includes("equipe:['owner']"),'Navegação deve classificar Equipe como módulo exclusivo de owner.');
expect(nav.includes("loadScript('assets/staff-management.js','padokaStaffManagement')"),'Gestão deve carregar o módulo de equipe pela carga validada.');
expect(nav.includes("current==='equipe'")&&nav.includes('function loadValidatedModuleScripts(role)'),'Módulo de equipe deve carregar somente na aba Equipe depois da validação do papel owner.');
expect(ui.includes("context.role!=='owner'"),'Frontend deve recusar funções diferentes de owner antes de montar a interface.');
expect(ui.includes('async function safeSession()')&&ui.includes("client.auth.getSession()")&&ui.includes("staff management session transport"),'Gestão de equipe deve capturar falhas retornadas e rejeições de transporte ao confirmar a sessão.');
expect(ui.includes('async function identityStillCurrent')&&ui.includes("window.padokaStaffRole==='owner'"),'Gestão de equipe deve reconfirmar identidade e papel owner após operações assíncronas.');
expect(ui.includes("if(!(await identityStillCurrent(currentUserId)))return;") ,'Inicialização deve falhar fechada se a identidade mudar antes da montagem da interface.');

const loadStart=ui.indexOf('async function load(){');
const loadRpc=ui.indexOf("client.rpc('padoka_list_staff')",loadStart);
const loadPreflight=ui.indexOf('if(!(await identityStillCurrent(expectedUserId)))return false;',loadStart);
expect(loadStart>=0&&loadPreflight>loadStart&&loadPreflight<loadRpc,'Listagem de equipe deve reconfirmar o mesmo owner antes de chamar padoka_list_staff.');
const probeStart=ui.indexOf('async function probeEnrollment');
const probeRpc=ui.indexOf("client.rpc('padoka_add_staff_by_email'",probeStart);
const probePreflight=ui.indexOf('if(!(await identityStillCurrent(expectedUserId)))return false;',probeStart);
expect(probeStart>=0&&probePreflight>probeStart&&probePreflight<probeRpc,'Probe de inclusão deve reconfirmar o mesmo owner antes da RPC de enrollment.');
const initStart=ui.indexOf('async function init(){');
const initRpc=ui.indexOf("client.rpc('padoka_list_staff')",initStart);
const initPreflight=ui.indexOf('if(!(await identityStillCurrent(currentUserId)))return;',initStart);
expect(initStart>=0&&initPreflight>initStart&&initPreflight<initRpc,'Bootstrap da Equipe deve reconfirmar o owner imediatamente antes da primeira RPC de listagem.');

expect(ui.includes("client.rpc('padoka_list_staff')"),'Frontend deve listar equipe somente pela RPC protegida.');
expect(ui.includes("client.rpc('padoka_update_staff'"),'Frontend deve alterar função/estado somente pela RPC protegida.');
expect(ui.includes("client.rpc('padoka_add_staff_by_email'"),'Frontend deve incluir funcionário somente pela RPC owner-only da migration 015.');
expect(ui.includes("staff enrollment transport")&&ui.includes("staff update transport")&&ui.includes("staff list transport"),'Inclusão, atualização e listagem devem tratar rejeições reais de transporte sem assumir sucesso.');
expect(ui.includes('Não foi possível confirmar a inclusão agora')&&ui.includes('Não foi possível confirmar a atualização'),'Falhas ambíguas de rede não podem ser apresentadas como sucesso para inclusão ou alteração de staff.');
expect(ui.includes("p_email:'',p_role:'attendant'"),'Detecção da migration 015 deve usar uma chamada inválida e sem efeito, sem cadastrar usuário durante o probe.');
expect(ui.includes('missingEnrollmentRpc(error)')&&ui.includes('enrollmentAvailable=false'),'RPC de inclusão ausente deve ocultar o formulário sem quebrar a aba Equipe.');
expect(ui.includes('type="email"')&&ui.includes("emailInput?.checkValidity()"),'Inclusão deve validar o e-mail no cliente antes da RPC.');
expect(ui.includes('Essa conta de autenticação ainda não existe'),'UI deve explicar que a inclusão não cria identidade Auth silenciosamente.');
expect(ui.includes('nunca cria conta, senha ou perfil de cliente automaticamente'),'Tela deve deixar explícito o isolamento entre staff, Auth e perfil de cliente.');
expect(!/\.from\(['"]padoka_staff_users['"]\)\.(insert|update|upsert|delete)/.test(ui),'Frontend não pode escrever diretamente em padoka_staff_users.');
expect(!/\.from\(['"]auth\.users['"]\)/.test(ui)&&!ui.includes('.auth.signUp('),'Tela de equipe não pode consultar auth.users diretamente nem criar contas Auth.');
expect(ui.includes("missingListRpc(error)")&&ui.includes("location.replace('gestao.html?tab=configuracoes')"),'Migration 014 ausente deve manter fallback seguro sem aba quebrada.');
expect(ui.includes("row.user_id===currentUserId")&&ui.includes("self?'disabled':''"),'Owner deve ter proteção visual contra remover o próprio acesso.');
expect(ui.includes("padoka-staff-management-ui")&&ui.includes("table:'padoka_staff_users'"),'Lista de equipe deve receber atualização Realtime.');
expect(ui.includes('const esc=value=>')&&ui.includes("esc(row.display_name")&&ui.includes("esc(row.email||row.user_id)"),'Nome/e-mail vindos do servidor devem ser escapados antes de innerHTML.');
expect(lifecycle.includes('async function safeSession(client)'),'Guard de lifecycle da Equipe deve centralizar a leitura segura da sessão.');
expect(/safeSession\(client\)[\s\S]*?auth\.getSession\(\)[\s\S]*?if\(error\)throw error;[\s\S]*?catch\(error\)/.test(lifecycle),'Guard de lifecycle deve tratar erro retornado pelo Auth e rejeição de transporte.');
expect(lifecycle.includes('const session=await safeSession(client);'),'Inicialização do guard de lifecycle deve usar safeSession.');
expect(lifecycle.includes("if(!session?.user?.id){")&&lifecycle.includes('clearStaffManagementUi(client);'),'Sessão não confirmada deve manter a área Equipe fail-closed.');
expect(sql.includes('join auth.users u on u.id = s.user_id'),'RPC owner-only deve resolver identificação do staff na origem Auth sem criar perfil PADOKA automático.');
expect(sql.includes('display_name text')&&sql.includes('email text'),'Listagem deve retornar identificação suficiente para a tela interna.');
expect(enrollSql.includes('from auth.users u')&&enrollSql.includes('insert into public.padoka_staff_users'),'Inclusão deve resolver Auth no servidor e escrever somente no cadastro interno PADOKA.');
expect(!/create\s+trigger[\s\S]{0,500}?\bon\s+auth\.users\b/i.test(sql+enrollSql),'Gestão de equipe não pode criar trigger global em auth.users.');

console.log('staff-management-frontend-audit: ok');