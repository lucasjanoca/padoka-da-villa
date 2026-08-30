import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dir = path.join(root, 'supabase');
const files = fs.readdirSync(dir)
  .filter(name => /^\d{3}_.+\.sql$/.test(name))
  .sort();

const fail = message => {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
};
const ok = message => console.log(`✓ ${message}`);
const read = name => fs.readFileSync(path.join(dir, name), 'utf8');

const expectedNumbers = Array.from({ length: files.length }, (_, i) => String(i + 1).padStart(3, '0'));
const actualNumbers = files.map(name => name.slice(0, 3));
const lastExpected = expectedNumbers.at(-1) || '000';
if (JSON.stringify(actualNumbers) !== JSON.stringify(expectedNumbers)) {
  fail(`cadeia de migrations deve ser contínua 001→${lastExpected}, sem números duplicados; encontrada: ${actualNumbers.join(', ')}`);
} else {
  ok(`cadeia de migrations contínua 001→${lastExpected}`);
}

for (const file of files) {
  const sql = read(file);
  const codeOnly = sql.replace(/^\s*--.*$/gm, '');

  const createdTables = [...codeOnly.matchAll(/create\s+table(?:\s+if\s+not\s+exists)?\s+public\.([a-zA-Z0-9_]+)/gi)].map(m => m[1]);
  for (const name of createdTables) {
    if (!name.startsWith('padoka_')) fail(`${file}: tabela fora do namespace padoka_: ${name}`);
  }

  const createdFunctions = [...codeOnly.matchAll(/create\s+or\s+replace\s+function\s+public\.([a-zA-Z0-9_]+)/gi)].map(m => m[1]);
  for (const name of createdFunctions) {
    if (!name.startsWith('padoka_')) fail(`${file}: função fora do namespace padoka_: ${name}`);
  }

  if (/create\s+trigger[\s\S]{0,600}?\bon\s+auth\.users\b/i.test(codeOnly)) {
    fail(`${file}: trigger global em auth.users é proibido`);
  }
  if (/\b(drop\s+table|truncate\s+table)\s+/i.test(codeOnly)) {
    fail(`${file}: operação destrutiva DROP/TRUNCATE não permitida na cadeia operacional`);
  }
  if (/\b(delete|update|insert)\s+(?:into\s+)?auth\./i.test(codeOnly)) {
    fail(`${file}: escrita direta no schema auth é proibida`);
  }

  const functionBlocks = [...codeOnly.matchAll(/create\s+or\s+replace\s+function\s+public\.([a-zA-Z0-9_]+)[\s\S]*?\$\$;/gi)];
  for (const match of functionBlocks) {
    const block = match[0];
    const name = match[1];
    if (/security\s+definer/i.test(block)) {
      const pinnedPublic=/set\s+search_path\s*(?:=|to)\s*['"]?public['"]?/i.test(block);
      const pinnedEmpty=/set\s+search_path\s*(?:=|to)\s*(?:''|"")/i.test(block);
      if (!pinnedPublic && !pinnedEmpty) {
        fail(`${file}: SECURITY DEFINER ${name} sem search_path explícito e fixo`);
      }
    }
  }
}

const requirements = {
  '003_operational_inventory_production_losses.sql': ['padoka_inventory', 'padoka_inventory_movements', 'padoka_production_plans', 'padoka_losses'],
  '004_pdv_sales_transaction.sql': ['padoka_sales', 'padoka_sale_items', 'padoka_inventory', 'padoka_create_sale'],
  '005_order_status_transition_rpc.sql': ['padoka_orders', 'padoka_update_order_status'],
  '006_production_completion_transaction.sql': ['padoka_production_plans', 'padoka_inventory', 'padoka_record_production'],
  '007_loss_idempotency.sql': ['padoka_losses', 'padoka_inventory', 'padoka_register_loss_once'],
  '008_staff_reporting_rpc.sql': ['padoka_sales', 'padoka_orders', 'padoka_losses', 'padoka_inventory', 'padoka_report_summary'],
  '009_internal_settings.sql': ['padoka_settings'],
  '010_pdv_sale_idempotency.sql': ['padoka_sales', 'padoka_create_sale_once'],
  '011_checkout_order_idempotency.sql': ['padoka_orders', 'padoka_create_order_once'],
  '012_pdv_sale_void_transaction.sql': ['padoka_sales', 'padoka_inventory', 'padoka_void_sale'],
  '013_customer_profile_rpc.sql': ['padoka_profiles', 'padoka_save_profile', 'privacy_accepted_at', 'app_scope'],
  '014_staff_management_rpc.sql': ['padoka_staff_users', 'padoka_list_staff', 'padoka_update_staff', 'cannot remove the last active owner'],
  '015_staff_enrollment_rpc.sql': ['padoka_staff_users', 'padoka_add_staff_by_email', 'auth user not found', 'padoka staff already exists'],
  '016_staff_audit_trail.sql': ['padoka_staff_audit', 'padoka_list_staff_audit', 'padoka_update_staff', 'padoka_add_staff_by_email', 'padoka_staff_owner_guard'],
  '017_product_catalog_management.sql': ['padoka_products', 'padoka_list_products_admin', 'padoka_save_product', 'product management permission required'],
  '018_product_catalog_audit.sql': ['padoka_product_audit', 'padoka_list_product_audit', 'padoka_save_product', 'before_state', 'after_state'],
  '019_operational_realtime_indexes.sql': ['supabase_realtime', 'padoka_inventory', 'padoka_inventory_movements', 'padoka_production_plans', 'padoka_losses'],
  '035_inventory_adjustment_idempotency.sql': ['padoka_inventory_adjustment_request_uidx', 'padoka_adjust_inventory_once', 'p_request_id uuid', 'inventory request id conflict'],
  '036_inventory_legacy_adjustment_hardening.sql': ['padoka_adjust_inventory(text, numeric, text, text, uuid)', 'from authenticated', 'to service_role'],
};

for (const [file, tokens] of Object.entries(requirements)) {
  if (!files.includes(file)) {
    fail(`migration obrigatória ausente: ${file}`);
    continue;
  }
  const sql = read(file);
  for (const token of tokens) {
    if (!sql.includes(token)) fail(`${file}: dependência/objeto esperado ausente: ${token}`);
  }
}

const m002 = read('002_server_authoritative_test_catalog.sql');
if (!/grant\s+select\s+on\s+public\.padoka_products\s+to\s+anon\s*,\s*authenticated/i.test(m002)) {
  fail('002: catálogo público deve manter apenas leitura pública explícita de padoka_products');
}

for (const file of files.filter(name => name !== '002_server_authoritative_test_catalog.sql')) {
  const sql = read(file).replace(/^\s*--.*$/gm, '');
  const anonGrants=[...sql.matchAll(/grant\s+([\s\S]{0,220}?)\s+to\s+anon(?:\s*,\s*authenticated)?\s*;/gi)].map(m=>m[0]);
  for (const grant of anonGrants) {
    const allowedPublicFlagRead =
      file === '041_enterprise_observability.sql' &&
      /grant\s+select\s+on\s+table\s+public\.padoka_feature_flags\s+to\s+anon\s*,\s*authenticated/i.test(grant);
    if (!allowedPublicFlagRead) fail(`${file}: grant para anon fora da superfície pública explicitamente auditada`);
    if (/\b(insert|update|delete|truncate|references|trigger|execute)\b/i.test(grant)) {
      fail(`${file}: anon nunca pode receber privilégio mutável/EXECUTE`);
    }
  }
}

if (!process.exitCode) {
  console.log(`\nPADOKA migration audit OK (${files.length} migrations).`);
}
