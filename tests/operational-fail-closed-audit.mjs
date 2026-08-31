import fs from 'node:fs';

const sync = fs.readFileSync('assets/operational-sync.js', 'utf8');
const gestao = fs.readFileSync('gestao.html', 'utf8');
const nav = fs.readFileSync('assets/internal-nav.js', 'utf8');
const lossRegistration = fs.readFileSync('assets/loss-registration.js', 'utf8');

const required = [
  "sb.from('padoka_inventory')",
  "sb.from('padoka_production_plans')",
  "sb.from('padoka_losses')",
  "sb.rpc('padoka_adjust_inventory_once'",
  "sb.rpc('padoka_update_inventory_metadata'",
  "sb.rpc('padoka_upsert_production_plan'",
  'lockOperationalUi(',
  'showUnavailable()',
  "window.addEventListener('padoka:catalog-updated'",
  'productById=id=>catalog.find(',
];

for (const marker of required) {
  if (!sync.includes(marker)) {
    throw new Error(`Operational sync perdeu proteção/integração obrigatória: ${marker}`);
  }
}

if (/rpc\('padoka_adjust_inventory'/.test(sync)) {
  throw new Error('Operational sync não pode voltar ao ajuste de estoque legado sem request_id.');
}

if (/rpc\('padoka_register_loss'/.test(sync) || /function registerLoss\(/.test(sync)) {
  throw new Error('Operational sync não pode manter o caminho legado de registro de perdas.');
}

if (!lossRegistration.includes("sb.rpc('padoka_register_loss_once'")) {
  throw new Error('Registro de perdas deve permanecer no módulo idempotente dedicado.');
}

if (/localStorage/.test(sync)) {
  throw new Error('Operational sync não pode persistir estoque, produção ou perdas em localStorage.');
}

if (/sessionStorage\.(?:getItem|setItem)\(['"]padoka_demo_(?:stock|production|losses)['"]/.test(sync)) {
  throw new Error('Operational sync não pode persistir dados operacionais demonstrativos na sessão.');
}

const scopedAdjustmentMarkers = [
  "ADJUST_KEY_PREFIX='padoka_pending_inventory_adjustment_v2:'",
  'pendingAdjustmentKey=(userId=activeUserId)',
  'parsed?.user_id!==userId',
  'JSON.stringify({...value,user_id:userId})',
  "sessionStorage.removeItem(LEGACY_ADJUST_KEY)",
];
for (const marker of scopedAdjustmentMarkers) {
  if (!sync.includes(marker)) {
    throw new Error(`SessionStorage operacional deve preservar somente retry idempotente de estoque vinculado ao staff: ${marker}`);
  }
}

if (/byId\s*=\s*Object\.fromEntries\(catalog\.map/.test(sync)) {
  throw new Error('Operational sync não pode congelar o índice do catálogo antes do carregamento assíncrono.');
}

const authLifecycleMarkers = [
  'async function safeSession()',
  'const {data,error}=await sb.auth.getSession()',
  "if(error){console.error('Falha ao confirmar sessão operacional PADOKA',error);return null}",
  "console.error('Falha de rede ao confirmar sessão operacional PADOKA',error)",
  'async function waitForStaffGuard(expectedUserId)',
  "document.documentElement.classList.contains('padoka-staff-pending')",
  "document.documentElement.classList.contains('padoka-role-pending')",
  'async function sessionStillMatches(expectedUserId,epoch=lifecycleEpoch)',
  'const session=await safeSession()',
  'if(!await waitForStaffGuard(expectedUserId)||epoch!==lifecycleEpoch)return',
  'onAuthStateChange',
  "clearOperationalState('Validando novamente o acesso interno…'",
  "start().catch(error=>{console.error('Falha ao iniciar sincronização operacional PADOKA',error)",
];

for (const marker of authLifecycleMarkers) {
  if (!sync.includes(marker)) {
    throw new Error(`Operational sync deve aguardar e revalidar a área interna autenticada: ${marker}`);
  }
}

const directGetSessionCalls = sync.match(/sb\.auth\.getSession\(\)/g) || [];
if (directGetSessionCalls.length !== 1) {
  throw new Error('Operational sync deve centralizar getSession exclusivamente em safeSession().');
}

if (!sync.includes("lockOperationalUi('Carregando dados operacionais seguros do servidor…')")) {
  throw new Error('Interface operacional deve iniciar bloqueada até o backend seguro carregar.');
}

for (const legacyMarker of ['padoka_demo_stock', 'padoka_demo_production', 'padoka_demo_losses']) {
  if (gestao.includes(legacyMarker)) {
    throw new Error(`Gestão não pode manter fallback operacional local legado: ${legacyMarker}`);
  }
}

if (/localStorage\.(?:getItem|setItem)\(['"]padoka_demo_(?:stock|production|losses)['"]/.test(gestao)) {
  throw new Error('Gestão não pode ler ou salvar estoque, produção ou perdas em localStorage.');
}

if (!nav.includes("loadScript('assets/operational-sync.js','padokaOps')")) {
  throw new Error('Gestão precisa carregar a sincronização operacional server-authoritative.');
}

if (!nav.includes("['estoque','producao','perdas','relatorios'].includes(current)")) {
  throw new Error('Sincronização operacional deve ficar limitada aos módulos operacionais da Gestão.');
}

if (!nav.includes("loadScript('assets/loss-registration.js','padokaLoss')")) {
  throw new Error('Gestão precisa carregar o registrador idempotente de perdas.');
}

if (!nav.includes("current==='perdas'")) {
  throw new Error('Registrador de perdas deve ficar limitado ao módulo Perdas.');
}

if (!gestao.includes('Carregando dados operacionais seguros do servidor…')) {
  throw new Error('Gestão deve iniciar os módulos operacionais em estado visual bloqueado.');
}

console.log('Operational fail-closed audit: OK');
