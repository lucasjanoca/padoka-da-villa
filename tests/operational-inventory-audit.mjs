import fs from 'node:fs';

const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const migration = read('supabase/003_operational_inventory_production_losses.sql');
const planningMigration = read('supabase/032_production_plan_rpc.sql');
const adjustmentMigration = read('supabase/035_inventory_adjustment_idempotency.sql');
const legacyHardening = read('supabase/036_inventory_legacy_adjustment_hardening.sql');
const sync = read('assets/operational-sync.js');
const failures = [];
const ok = (cond, msg) => { if (!cond) failures.push(msg); };

ok(migration.includes('public.padoka_update_inventory_metadata'), 'migration 003: RPC de metadados do estoque ausente');
ok(migration.includes("padoka_staff_has_role(array['owner','manager','stock'])"), 'migration 003: RPC de metadados não limita função interna');
ok(/unknown or inactive product/.test(migration), 'migration 003: RPC de metadados não valida produto ativo');
ok(/on conflict \(product_id\) do update/i.test(migration), 'migration 003: RPC não cria a linha de estoque para produto novo');
ok(!/grant\s+update\s*\([^)]*(?:barcode|min_quantity)[^)]*\)\s+on\s+public\.padoka_inventory\s+to\s+authenticated/i.test(migration), 'migration 003: UPDATE direto de metadados continua concedido');
ok(/grant\s+execute\s+on\s+function\s+public\.padoka_update_inventory_metadata\(text,text,numeric\)\s+to\s+authenticated/i.test(migration), 'migration 003: execute da RPC não foi concedido ao authenticated');
ok(sync.includes("rpc('padoka_update_inventory_metadata'"), 'operational-sync.js: metadados do estoque não usam RPC');
ok(!/from\('padoka_inventory'\)\.update\(/.test(sync), 'operational-sync.js: ainda existe UPDATE direto em padoka_inventory');
ok(sync.includes('lockOperationalUi('), 'operational-sync.js: gestão não bloqueia o fallback local antes da sincronização');
ok(sync.includes('showUnavailable()'), 'operational-sync.js: estado indisponível fail-closed ausente');
ok(sync.includes('salvar informações apenas neste navegador'), 'operational-sync.js: mensagem de bloqueio do fallback local ausente');
ok(/if\(p\.error\)\{if\(relationMissing\(p\.error\)\)return false/.test(sync), 'operational-sync.js: produção não falha fechada quando a relação está ausente');
ok(/if\(l\.error\)\{if\(relationMissing\(l\.error\)\)return false/.test(sync), 'operational-sync.js: perdas não falham fechadas quando a relação está ausente');

ok(adjustmentMigration.includes('public.padoka_adjust_inventory_once'), 'migration 035: RPC idempotente de ajuste ausente');
ok(adjustmentMigration.includes("padoka_staff_has_role(array['owner','manager','stock'])"), 'migration 035: ajuste idempotente não limita função interna');
ok(/auth\.uid\(\) is null/i.test(adjustmentMigration), 'migration 035: ajuste idempotente não exige autenticação explícita');
ok(/p_request_id uuid/i.test(adjustmentMigration), 'migration 035: ajuste idempotente sem request_id');
ok(/where source = 'adjustment' and reference_id is not null/i.test(adjustmentMigration), 'migration 035: índice idempotente não está limitado aos ajustes manuais');
ok(/inventory request id conflict/i.test(adjustmentMigration), 'migration 035: request_id reutilizado com payload diferente não é rejeitado');
ok(/set\s+search_path\s*=\s*public/i.test(adjustmentMigration), 'migration 035: SECURITY DEFINER sem search_path fixo');
ok(/revoke all on function public\.padoka_adjust_inventory_once\(text, numeric, text, uuid\) from anon/i.test(adjustmentMigration), 'migration 035: anon não foi explicitamente revogado da RPC idempotente');
ok(/grant execute on function public\.padoka_adjust_inventory_once\(text, numeric, text, uuid\) to authenticated/i.test(adjustmentMigration), 'migration 035: authenticated não recebeu EXECUTE da RPC idempotente');
ok(/revoke all on function public\.padoka_adjust_inventory\(text, numeric, text, text, uuid\) from authenticated/i.test(legacyHardening), 'migration 036: RPC legada continua executável por authenticated');
ok(/grant execute on function public\.padoka_adjust_inventory\(text, numeric, text, text, uuid\) to service_role/i.test(legacyHardening), 'migration 036: RPC legada não ficou restrita ao service_role');
ok(sync.includes("rpc('padoka_adjust_inventory_once'"), 'operational-sync.js: ajuste manual não usa RPC idempotente');
ok(!sync.includes("rpc('padoka_adjust_inventory'"), 'operational-sync.js: ajuste manual ainda chama RPC legada sem idempotência');
ok(sync.includes("ADJUST_KEY_PREFIX='padoka_pending_inventory_adjustment_v2:'"), 'operational-sync.js: retry de ajuste não usa chave versionada por identidade');
ok(sync.includes("LEGACY_ADJUST_KEY='padoka_pending_inventory_adjustment_v1'"), 'operational-sync.js: chave legada de ajuste não é reconhecida para descarte');
ok(sync.includes('pendingAdjustmentKey=(userId=activeUserId)'), 'operational-sync.js: chave de retry não depende do user_id ativo');
ok(sync.includes('parsed?.user_id!==userId'), 'operational-sync.js: payload persistido não valida o dono da tentativa');
ok(sync.includes('JSON.stringify({...value,user_id:userId})'), 'operational-sync.js: retry persistido não grava o user_id do funcionário');
ok(sync.includes('sessionStorage.removeItem(LEGACY_ADJUST_KEY)'), 'operational-sync.js: chave legada compartilhada não é descartada');
ok(!sync.includes('sessionStorage.removeItem(ADJUST_KEY)'), 'operational-sync.js: ainda existe limpeza por chave global de ajuste');
ok(!sync.includes('identityChanged'), 'operational-sync.js: troca de identidade ainda usa limpeza global do retry');
ok(sync.includes('crypto.randomUUID()'), 'operational-sync.js: ajuste não gera request_id estável');
ok(sync.includes('reconcilePendingAdjustment('), 'operational-sync.js: tentativa pendente não é reconciliada após recarregar');
ok(sync.includes('readPendingAdjustment(expectedUserId)'), 'operational-sync.js: reconciliação não está vinculada ao funcionário esperado');
ok(sync.includes('clearPendingAdjustment(pending.request_id,expectedUserId)'), 'operational-sync.js: reconciliação pode limpar retry de outra identidade');
ok(sync.includes('writePendingAdjustment(pending,userId)'), 'operational-sync.js: novo ajuste não é persistido sob a identidade atual');
ok(sync.includes('Pressione Enter para repetir a mesma operação com segurança'), 'operational-sync.js: resposta ambígua não orienta retry com o mesmo request_id');
ok(/try\s*\{[\s\S]*?await sb\.rpc\('padoka_adjust_inventory_once'/.test(sync), 'operational-sync.js: rejeição de transporte no ajuste não é capturada');
ok(/catch\(requestError\)[\s\S]*?error=requestError/.test(sync), 'operational-sync.js: falha de transporte não é preservada como erro ambíguo para retry');

ok(planningMigration.includes('public.padoka_upsert_production_plan'), 'migration 032: RPC de planejamento ausente');
ok(planningMigration.includes("padoka_staff_has_role(array['owner','manager','production'])"), 'migration 032: RPC de planejamento não restringe função interna');
ok(/security definer/i.test(planningMigration), 'migration 032: RPC de planejamento não é server-authoritative');
ok(/set\s+search_path\s*=\s*public/i.test(planningMigration), 'migration 032: RPC de planejamento sem search_path fixo');
ok(/auth\.uid\(\) is null/i.test(planningMigration), 'migration 032: RPC de planejamento não exige autenticação explícita');
ok(/revoke all on function public\.padoka_upsert_production_plan\(date, text, numeric, text\) from anon/i.test(planningMigration), 'migration 032: anon não foi explicitamente revogado da RPC');
ok(/grant execute on function public\.padoka_upsert_production_plan\(date, text, numeric, text\) to authenticated/i.test(planningMigration), 'migration 032: authenticated não recebeu EXECUTE da RPC');
ok(sync.includes("rpc('padoka_upsert_production_plan'"), 'operational-sync.js: planejamento não usa RPC server-authoritative');
ok(!/from\('padoka_production_plans'\)\.upsert\(/.test(sync), 'operational-sync.js: ainda existe UPSERT direto em padoka_production_plans');

ok(sync.includes('onAuthStateChange'), 'operational-sync.js: não acompanha logout/troca de conta do staff');
ok(sync.includes('lifecycleEpoch'), 'operational-sync.js: respostas assíncronas antigas não são invalidadas por lifecycle');
ok(sync.includes('activeUserId'), 'operational-sync.js: operações não ficam vinculadas à identidade ativa');
ok(sync.includes("classList.contains('padoka-staff-pending')"), 'operational-sync.js: reativação não espera o guard global de staff');
ok(sync.includes('sessionStillMatches'), 'operational-sync.js: resposta de RPC não reconfirma a mesma sessão');
ok(sync.includes('sb.removeChannel(channel)'), 'operational-sync.js: canal Realtime anterior não é removido na troca de identidade');
ok(sync.includes("clearOperationalState('Validando novamente o acesso interno…')"), 'operational-sync.js: troca de conta não limpa o estado operacional em memória');
ok(sync.includes("window.addEventListener('pagehide'"), 'operational-sync.js: lifecycle não encerra subscription/canal ao sair da página');

if (failures.length) {
  console.error(`PADOKA inventory audit: ${failures.length} falha(s)`);
  failures.forEach(x => console.error(`- ${x}`));
  process.exit(1);
}
console.log('PADOKA inventory audit: OK');
