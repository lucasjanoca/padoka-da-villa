import fs from 'node:fs';

const migration=fs.readFileSync('supabase/007_loss_idempotency.sql','utf8');
const exposureMigration=fs.readFileSync('supabase/033_loss_rpc_exposure_hardening.sql','utf8');
const migrationCode=migration.replace(/^\s*--.*$/gm,'');
const frontend=fs.readFileSync('assets/loss-registration.js','utf8');
const nav=fs.readFileSync('assets/internal-nav.js','utf8');

const checks=[
  ['migration alvo correto',/yncspxfsvlqdnodlsosb/.test(migration)&&/NÃO aplicar no projeto InfoTech\.io/.test(migration)],
  ['sem trigger global em auth.users',!/create\s+trigger[\s\S]{0,600}?\bon\s+auth\.users\b/i.test(migrationCode)],
  ['request_id único',/padoka_losses_request_id_uidx/.test(migration)&&/where request_id is not null/i.test(migration)],
  ['RPC idempotente dedicada',/padoka_register_loss_once/.test(migration)&&/p_request_id uuid/.test(migration)],
  ['rejeita conflito de request id',/loss request id conflict/.test(migration)],
  ['lock de estoque antes da baixa',/padoka_inventory[\s\S]*for update/i.test(migration)],
  ['bloqueia estoque insuficiente',/insufficient inventory/.test(migration)],
  ['movimento referencia a perda',/source,reference_id[\s\S]*'loss',v_loss\.id/s.test(migration)],
  ['anon não executa RPC',/revoke all on function public\.padoka_register_loss_once[\s\S]*from public, anon/i.test(migration)],
  ['RPC legada não é executável pelo navegador',/revoke execute on function public\.padoka_register_loss\(text, numeric, text, text\) from public, anon, authenticated/i.test(exposureMigration)],
  ['RPC idempotente segue disponível ao autenticado',/grant execute on function public\.padoka_register_loss_once\(text, numeric, text, text, uuid\) to authenticated, service_role/i.test(exposureMigration)],
  ['frontend usa RPC idempotente',/rpc\('padoka_register_loss_once'/.test(frontend)],
  ['frontend preserva request no sessionStorage',/sessionStorage/.test(frontend)&&/padoka_pending_loss_v1/.test(frontend)],
  ['retry mantém mesmos dados',/pending\|\|currentOperation/.test(frontend)&&/Tentar novamente/.test(frontend)],
  ['resposta ambígua não libera formulário',/networkish\(error\)[\s\S]*lockForm\(true\)/.test(frontend)],
  ['clique é interceptado mesmo sem capability',/function intercept\(e\)[\s\S]*if\(!btn\)return;[\s\S]*preventDefault\(\)[\s\S]*if\(!enabled\)/.test(frontend)],
  ['capability ausente mantém formulário bloqueado',/function blockCapability[\s\S]*btn\.disabled=true[\s\S]*Registro indisponível/.test(frontend)&&/if\(probe\.error\)[\s\S]*blockCapability\(\)/.test(frontend)],
  ['frontend não altera estoque diretamente',!/(from\('padoka_inventory'\).*?(insert|update|upsert)|\.from\('padoka_inventory'\)\.update)/s.test(frontend)],
  ['módulo carrega só na gestão',/gestao\.html/.test(frontend)&&/loss-registration\.js/.test(nav)]
];

let failed=0;
for(const [name,ok] of checks){console.log(`${ok?'✓':'✗'} ${name}`);if(!ok)failed++}
if(failed){console.error(`\n${failed} verificação(ões) falharam.`);process.exit(1)}
console.log('\nAuditoria de perdas idempotentes concluída.');
