import fs from 'node:fs';

const src=fs.readFileSync('assets/customer-notifications.js','utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const need=(re,m)=>{if(!re.test(src))fail(m)};

try{new Function(src)}catch(error){fail(`customer-notifications.js contém erro de sintaxe: ${error.message}`)}

need(/let lifecycleEpoch=0, activeUserId=['"]{2}/i,'notificações precisam manter geração de lifecycle e identidade ativa');
need(/async function safeSession\(\)/i,'notificações precisam centralizar a confirmação segura da sessão');
need(/const \{data,error\}=await client\.auth\.getSession\(\)/i,'confirmação de sessão precisa inspecionar erros do Supabase Auth');
need(/Falha de rede ao confirmar sessão das notificações PADOKA/i,'falha de transporte do Auth precisa ser tratada em modo fail-closed');
need(/async function sessionStillCurrent\(epoch,userId\)/i,'notificações precisam revalidar a mesma identidade antes e depois de operações assíncronas');
need(/async function load\(epoch=lifecycleEpoch,userId=activeUserId\)[\s\S]*?if\(!await sessionStillCurrent\(epoch,userId\)\)return false;[\s\S]*?\.from\(['"]padoka_customer_notifications['"]\)/i,'listagem só pode consultar notificações após reconfirmar a sessão atual');
need(/\.from\(['"]padoka_customer_notifications['"]\)[\s\S]*?\.limit\(30\);\s*if\(!await sessionStillCurrent\(epoch,userId\)\)return false;[\s\S]*?render\(data\|\|\[\],epoch,userId\)/i,'resposta da listagem só pode renderizar após reconfirmar a mesma identidade');
need(/async function markOneRead\(id,epoch=lifecycleEpoch,userId=activeUserId\)[\s\S]*?sessionStillCurrent\(epoch,userId\)[\s\S]*?\.update\(\{read_at:/i,'marcação individual precisa fazer preflight de sessão antes da escrita');
need(/async function markAllRead\(\)[\s\S]*?const epoch=lifecycleEpoch;\s*const userId=activeUserId;[\s\S]*?sessionStillCurrent\(epoch,userId\)[\s\S]*?\.update\(\{read_at:/i,'marcação em lote precisa capturar e reconfirmar a identidade antes da escrita');
need(/\.eq\(['"]user_id['"],userId\)/i,'leituras e escritas precisam continuar vinculadas explicitamente ao user_id atual');
need(/async function setSession\(next\)[\s\S]*?const epoch=\+\+lifecycleEpoch;[\s\S]*?root\.hidden=true;[\s\S]*?renderEmpty\(\)/i,'troca de conta precisa limpar a interface imediatamente antes de aguardar operações assíncronas');
need(/const previousChannel=channel;\s*channel=null;[\s\S]*?removeChannel\(previousChannel\)/i,'canal Realtime anterior precisa ser desassociado antes de montar a nova identidade');
need(/if\(epoch!==lifecycleEpoch\|\|activeUserId!==userId\|\|current\?\.user\?\.id!==userId\)return/i,'setSession antiga não pode reativar uma identidade depois de nova troca de conta');
need(/filter:['"]user_id=eq\.['"]\+userId/i,'Realtime precisa permanecer filtrado ao cliente autenticado');
need(/if\(lifecycleCurrent\(epoch,userId\)\)load\(epoch,userId\)/i,'callback Realtime antigo precisa ser ignorado depois de troca de identidade');
need(/onAuthStateChange/i,'central de notificações precisa reagir a logout e troca de conta');
need(/pagehide[\s\S]*?lifecycleEpoch\+\+;[\s\S]*?activeUserId=['"]{2};[\s\S]*?session=null/i,'saída da página precisa invalidar respostas assíncronas pendentes');

if(!process.exitCode)console.log('Customer notifications lifecycle audit: OK');
