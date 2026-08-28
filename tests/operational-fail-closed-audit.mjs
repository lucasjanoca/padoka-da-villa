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

if (!sync.includes("const ADJUST_KEY='padoka_pending_inventory_adjustment_v1'")) {
  throw new Error('SessionStorage operacional só é permitido para preservar a tentativa idempotente de ajuste de estoque.');
}

if (/byId\s*=\s*Object\.fromEntries\(catalog\.map/.test(sync)) {
  throw new Error('Operational sync não pode congelar o índice do catálogo antes do carregamento assíncrono.');
}

const authLifecycleMarkers = [
  'async function waitForStaffGuard(expectedUserId)',
  "document.documentElement.classList.contains('padoka-staff-pending')",
  "document.documentElement.classList.contains('padoka-role-pending')",
  'async function sessionStillMatches(expectedUserId,epoch=lifecycleEpoch)',
  'if(!await waitForStaffGuard(expectedUserId)||epoch!==lifecycleEpoch)return',
  'const {data:{session}}=await sb.auth.getSession()',
  'onAuthStateChange',
  "clearOperationalState('Validando novamente o acesso interno…'",
];

for (const marker of authLifecycleMarkers) {
  if (!sync.includes(marker)) {
    throw new Error(`Operational sync deve aguardar e revalidar a área interna autenticada: ${marker}`);
  }
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

if (!nav.includes("s.src='assets/operational-sync.js'")) {
  throw new Error('Gestão precisa carregar a sincronização operacional server-authoritative.');
}

if (!nav.includes("s.src='assets/loss-registration.js'")) {
  throw new Error('Gestão precisa carregar o registrador idempotente de perdas.');
}

if (!gestao.includes('Carregando dados operacionais seguros do servidor…')) {
  throw new Error('Gestão deve iniciar os módulos operacionais em estado visual bloqueado.');
}

console.log('Operational fail-closed audit: OK');
