import fs from 'node:fs';

const js=fs.readFileSync('assets/customer-notifications.js','utf8');
const account=fs.readFileSync('conta.html','utf8');
const tracking=fs.readFileSync('acompanhamento.html','utf8');
const baseMigration=fs.readFileSync('supabase/052_customer_notification_center.sql','utf8');
const hardening=fs.readFileSync('supabase/073_customer_notification_read_rpc.sql','utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const need=(c,m)=>{if(!c)fail(m)};

need(account.includes('assets/customer-notifications.js'),'Conta: central de notificações ausente');
need(tracking.includes('assets/customer-notifications.js'),'Acompanhamento: central de notificações ausente');
need(js.includes(".from('padoka_customer_notifications')"),'Central: fonte de notificações ausente');
need(js.includes(".eq('user_id',userId)"),'Central: filtro explícito por usuário ausente');
need(js.includes('sessionStillCurrent(epoch,userId)'),'Central: revalidação de sessão ausente');
need(js.includes('lifecycleCurrent(epoch,userId)'),'Central: proteção contra resposta assíncrona de sessão antiga ausente');
need(js.includes("table:'padoka_customer_notifications'"),'Central: Realtime de notificações ausente');
need(js.includes("client.rpc('padoka_mark_customer_notifications_read'"),'Central: marcação de lidas deve passar pela RPC autoritativa');
need(!js.includes(".update({read_at:"),'Central: não deve atualizar read_at diretamente');
need(!/innerHTML\s*=.*(?:row\.|title|body)/.test(js),'Central: conteúdo do servidor não deve entrar via innerHTML');
need(/security definer/i.test(hardening)&&/set search_path=''/i.test(hardening),'Banco: implementação privada deve ser SECURITY DEFINER com search_path fechado');
need(/auth\.uid\(\)/i.test(hardening),'Banco: RPC deve vincular a mutação ao usuário autenticado');
need(/revoke update\(read_at\).*authenticated/i.test(hardening),'Banco: grant direto de UPDATE(read_at) deve ser removido');
need(/drop policy if exists padoka_customer_notifications_own_update/i.test(hardening),'Banco: policy direta de UPDATE deve ser removida');
need(/security invoker/i.test(hardening)&&/public\.padoka_mark_customer_notifications_read/i.test(hardening),'Banco: endpoint público deve ser wrapper SECURITY INVOKER');
need(/alter publication supabase_realtime add table public\.padoka_customer_notifications/i.test(baseMigration),'Banco: notificações não estão habilitadas no Realtime');
need(/user_id, created_at desc/i.test(baseMigration),'Banco: índice para histórico do cliente ausente');

if(!process.exitCode)console.log('Customer notification center audit: OK');
