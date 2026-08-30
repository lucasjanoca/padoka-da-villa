import fs from 'node:fs';

const js=fs.readFileSync('assets/customer-notifications.js','utf8');
const account=fs.readFileSync('conta.html','utf8');
const tracking=fs.readFileSync('acompanhamento.html','utf8');
const migration=fs.readFileSync('supabase/052_customer_notification_center.sql','utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const need=(c,m)=>{if(!c)fail(m)};

need(account.includes('assets/customer-notifications.js'),'Conta: central de notificações ausente');
need(tracking.includes('assets/customer-notifications.js'),'Acompanhamento: central de notificações ausente');
need(js.includes(".from('padoka_customer_notifications')"),'Central: fonte de notificações ausente');
need(js.includes(".eq('user_id',userId)"),'Central: filtro explícito por usuário ausente');
need(js.includes('sessionStillCurrent(epoch,userId)'),'Central: revalidação de sessão ausente');
need(js.includes('lifecycleCurrent(epoch,userId)'),'Central: proteção contra resposta assíncrona de sessão antiga ausente');
need(js.includes("table:'padoka_customer_notifications'"),'Central: Realtime de notificações ausente');
need(js.includes(".is('read_at',null)"),'Central: marcação de lidas não é idempotente');
need(!/innerHTML\s*=.*(?:row\.|title|body)/.test(js),'Central: conteúdo do servidor não deve entrar via innerHTML');
need(/grant update\(read_at\)/i.test(migration),'Banco: cliente deve atualizar somente read_at');
need(/alter publication supabase_realtime add table public\.padoka_customer_notifications/i.test(migration),'Banco: notificações não estão habilitadas no Realtime');
need(/user_id, created_at desc/i.test(migration),'Banco: índice para histórico do cliente ausente');

if(!process.exitCode)console.log('Customer notification center audit: OK');
