import fs from 'node:fs';

const sql=fs.readFileSync('supabase/006_production_completion_transaction.sql','utf8');
const fail=(m)=>{console.error('FAIL:',m);process.exitCode=1};
const need=(re,m)=>{if(!re.test(sql))fail(m)};
const forbid=(re,m)=>{if(re.test(sql))fail(m)};

need(/create table if not exists public\.padoka_production_batches/i,'faltou padoka_production_batches');
need(/request_id uuid not null unique/i,'request_id precisa ser único para idempotência');
need(/create or replace function public\.padoka_record_production/i,'faltou RPC padoka_record_production');
need(/padoka_staff_has_role\(array\['owner','manager','production'\]\)/i,'RPC precisa restringir perfis de produção');
need(/for update;/i,'plano precisa ser bloqueado durante o registro');
need(/where request_id = p_request_id/g,'RPC precisa revalidar idempotência');
const idempotencyChecks=(sql.match(/where request_id = p_request_id/g)||[]).length;
if(idempotencyChecks<2)fail('idempotência deve ser checada antes e depois do lock');
const conflictChecks=(sql.match(/production request id conflict/g)||[]).length;
if(conflictChecks<2)fail('request_id repetido com plano/quantidade diferente deve falhar antes e depois do lock');
need(/v_batch\.plan_id is distinct from p_plan_id/i,'idempotência deve validar o plano original');
need(/v_batch\.quantity is distinct from p_quantity/i,'idempotência deve validar a quantidade original');
need(/quantity = public\.padoka_inventory\.quantity \+ excluded\.quantity/i,'produção precisa incrementar estoque na transação');
need(/produced_quantity = v_new_produced/i,'produção precisa atualizar produzido do plano');
need(/'production',v_batch\.id/i,'movimento de estoque precisa referenciar o lote de produção');
need(/revoke all on public\.padoka_production_batches from anon, authenticated/i,'tabela de lotes deve começar com privilégios revogados');
need(/grant select on public\.padoka_production_batches to authenticated/i,'staff autenticado precisa de leitura sujeita a RLS');
need(/revoke all on function public\.padoka_record_production\(uuid,numeric,uuid\) from public, anon/i,'RPC não pode ser executável por anon/public');
forbid(/trigger[^;]*auth\.users/is,'migration não pode criar trigger global em auth.users');
forbid(/grant (insert|update|delete).*padoka_production_batches.*authenticated/i,'frontend não deve escrever lotes diretamente');

if(!process.exitCode)console.log('Production transaction audit: OK');
