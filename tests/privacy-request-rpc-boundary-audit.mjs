import fs from 'node:fs';

const migration=fs.readFileSync('supabase/074_privacy_request_rpc_boundary.sql','utf8');
const page=fs.readFileSync('conta.html','utf8');
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const need=(s,r,m)=>{if(!r.test(s))fail(m)};
const forbid=(s,r,m)=>{if(r.test(s))fail(m)};

need(migration,/create or replace function padoka_rpc_private\.request_privacy_action\s*\(/i,'implementação privada da solicitação de privacidade ausente');
need(migration,/security definer[\s\S]*set search_path\s*=\s*''/i,'implementação privada precisa de SECURITY DEFINER e search_path vazio');
need(migration,/v_user_id uuid\s*:=\s*auth\.uid\(\)/i,'RPC privada precisa fixar a identidade em auth.uid()');
need(migration,/p_type not in \('export','delete','correct'\)/i,'RPC precisa validar o tipo permitido');
need(migration,/char_length\(p_details\)\s*>\s*600/i,'RPC precisa limitar detalhes');
need(migration,/create unique index if not exists padoka_privacy_requests_one_active_type_uidx/i,'falta proteção concorrente contra solicitação ativa duplicada');
need(migration,/where status in \('pending','in_progress'\)/i,'índice precisa limitar apenas solicitações ativas');
need(migration,/create or replace function public\.padoka_request_privacy_action[\s\S]*security invoker/i,'endpoint público precisa permanecer SECURITY INVOKER');
need(migration,/revoke insert on table public\.padoka_privacy_requests from public,anon,authenticated/i,'INSERT direto precisa permanecer revogado');
need(migration,/drop policy if exists padoka_privacy_own_insert/i,'policy de INSERT direto precisa ser removida');
need(page,/\.rpc\(['"]padoka_request_privacy_action['"]/i,'conta precisa continuar usando a RPC de privacidade');
forbid(page,/\.from\(['"]padoka_privacy_requests['"]\)[\s\S]{0,160}\.insert\(/i,'conta não pode inserir diretamente em padoka_privacy_requests');

if(!process.exitCode)console.log('Privacy request RPC boundary audit: OK');
