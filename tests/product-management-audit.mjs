import fs from 'node:fs';

const fail = message => { console.error(`❌ ${message}`); process.exitCode = 1; };
const ok = message => console.log(`✓ ${message}`);
const read = file => fs.readFileSync(file, 'utf8');

const sql = read('supabase/017_product_catalog_management.sql');
const publicCatalogSql = read('supabase/002_server_authoritative_test_catalog.sql');
const js = read('assets/product-management.js');
const nav = read('assets/internal-nav.js');
const navCss = read('assets/internal-nav.css');

const requireSql = (pattern, label) => pattern.test(sql) ? ok(label) : fail(label);
const requirePublicCatalogSql = (pattern, label) => pattern.test(publicCatalogSql) ? ok(label) : fail(label);
const requireJs = (pattern, label) => pattern.test(js) ? ok(label) : fail(label);
const requireCss = (pattern, label) => pattern.test(navCss) ? ok(label) : fail(label);

requireSql(/padoka_list_products_admin/i, 'RPC administrativa de listagem existe');
requireSql(/padoka_save_product/i, 'RPC administrativa de gravação existe');
requireSql(/padoka_staff_has_role\(array\['owner','manager'\]\)/i, 'somente owner/manager podem gerenciar catálogo');
requireSql(/security\s+definer[\s\S]*?set\s+search_path\s*=\s*public/i, 'RPCs SECURITY DEFINER fixam search_path');
requireSql(/revoke\s+insert\s*,\s*update\s*,\s*delete\s+on\s+public\.padoka_products\s+from\s+anon\s*,\s*authenticated/i, 'escrita direta no catálogo fica revogada');
requirePublicCatalogSql(/grant\s+select\s+on\s+public\.padoka_products\s+to\s+anon\s*,\s*authenticated/i, 'leitura pública do catálogo ativo é preservada na migration pública');
requirePublicCatalogSql(/create\s+policy\s+"padoka public active products"[\s\S]*?to\s+anon\s*,\s*authenticated[\s\S]*?using\s*\(active\s*=\s*true\)/i, 'leitura pública continua limitada a produtos ativos por RLS');
requireSql(/invalid product id/i, 'ID de produto é validado');
requireSql(/invalid product price/i, 'preço de produto é validado');
requireSql(/on\s+conflict\s*\(id\)\s*do\s+update/i, 'produto é criado/atualizado sem delete destrutivo');
if (/create\s+trigger[\s\S]{0,500}?on\s+auth\.users/i.test(sql.replace(/^\s*--.*$/gm,''))) fail('migration 017 não pode criar trigger em auth.users'); else ok('migration 017 sem trigger global em auth.users');

requireJs(/\['owner','manager'\]\.includes\(context\.role\)/, 'frontend aparece somente para owner/manager');
requireJs(/client\.rpc\('padoka_list_products_admin'\)/, 'frontend lista catálogo via RPC');
requireJs(/client\.rpc\('padoka_save_product'/, 'frontend salva catálogo via RPC');
requireJs(/is_demo/, 'frontend preserva marcação provisória');
requireJs(/confirm\('Marcar este produto como oficial\?/, 'retirada da marca provisória exige confirmação');
requireJs(/data-field="active"/, 'frontend permite desativar sem apagar histórico');
requireJs(/onAuthStateChange/, 'gestão de catálogo acompanha logout e troca de conta');
requireJs(/lifecycleEpoch/, 'gestão de catálogo invalida operações assíncronas antigas por epoch');
requireJs(/activeUserId/, 'gestão de catálogo vincula o estado à identidade autenticada atual');
requireJs(/sessionStillMatches\(expectedUserId,expectedEpoch\)/, 'listagens e gravações revalidam sessão e identidade');
requireJs(/resetForAuthChange\(\)[\s\S]*?padokaProductAdmin['"]\)\?\.remove\(\)/, 'troca de identidade remove imediatamente controles e estado do catálogo anterior');
requireJs(/if\(!await sessionStillMatches\(operationUserId,operationEpoch\)\)return;/, 'resposta de gravação antiga não continua após troca de funcionário');
requireJs(/padoka-product-admin-ui-\$\{activeUserId\}/, 'canal Realtime do catálogo fica associado à identidade validada');
requireJs(/cleanupRealtime\(\)/, 'canal Realtime anterior é removido antes de reutilizar o módulo');
if (/\.from\(['"]padoka_products['"]\)\.(insert|update|upsert|delete)/i.test(js)) fail('frontend não pode escrever diretamente em padoka_products'); else ok('frontend sem escrita direta em padoka_products');
if (/localStorage/i.test(js)) fail('gestão de catálogo não deve usar localStorage'); else ok('gestão de catálogo sem localStorage');

if (/assets\/product-management\.js/.test(nav)) ok('navegação interna carrega gestão de catálogo'); else fail('navegação interna precisa carregar product-management.js');
requireCss(/#app #padokaProductAdmin\{display:none!important\}/, 'gestão de catálogo fica oculta por padrão durante troca/revalidação de staff');
requireCss(/data-staff-role="owner"[\s\S]*?#padokaProductAdmin[\s\S]*?data-staff-role="manager"[\s\S]*?#padokaProductAdmin/, 'somente owner/manager tornam os controles de catálogo visíveis após revalidação');

if (!process.exitCode) console.log('\nPADOKA product management audit OK.');
