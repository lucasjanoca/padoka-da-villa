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
ok(sync.includes("const ADJUST_KEY='padoka_pending_inventory_adjustment_v1'"), 'operational-sync.js: tentativa pendente de ajuste não é persistida na sessão');
ok(sync.includes('crypto.randomUUID()'), 'operational-sync.js: ajuste não gera request_id estável');
ok(sync.includes('reconcilePendingAdjustment()'), 'operational-sync.js: tentativa pendente não é reconciliada após recarregar');
ok(sync.includes('Pressione Enter para repetir a mesma operação com segurança'), 'operational-sync.js: resposta ambígua não orienta retry com o mesmo request_id');

ok(planningMigration.includes('public.padoka_upsert_production_plan'), 'migration 032: RPC de planejamento ausente');
ok(planningMigration.includes("padoka_staff_has_role(array['owner','manager','production'])"), 'migration 032: RPC de planejamento não restringe função interna');
ok(/security definer/i.test(planningMigration), 'migration 032: RPC de planejamento não é server-authoritative');
ok(/set\s+search_path\s*=\s*public/i.test(planningMigration), 'migration 032: RPC de planejamento sem search_path fixo');
ok(/auth\.uid\(\) is null/i.test(planningMigration), 'migration 032: RPC de planejamento não exige autenticação explícita');
ok(/revoke all on function public\.padoka_upsert_production_plan\(date, text, numeric, text\) from anon/i.test(planningMigration), 'migration 032: anon não foi explicitamente revogado da RPC');
ok(/grant execute on function public\.padoka_upsert_production_plan\(date, text, numeric, text\) to authenticated/i.test(planningMigration), 'migration 032: authenticated não recebeu EXECUTE da RPC');
ok(sync.includes("rpc('padoka_upsert_production_plan'"), 'operational-sync.js: planejamento não usa RPC server-authoritative');
ok(!/from\('padoka_production_plans'\)\.upsert\(/.test(sync), 'operational-sync.js: ainda existe UPSERT direto em padoka_production_plans');

if (failures.length) {
  console.error(`PADOKA inventory audit: ${failures.length} falha(s)`);
  failures.forEach(x => console.error(`- ${x}`));
  process.exit(1);
}
console.log('PADOKA inventory audit: OK');
