import fs from 'node:fs';

const sync = fs.readFileSync('assets/operational-sync.js', 'utf8');
const gestao = fs.readFileSync('gestao.html', 'utf8');
const nav = fs.readFileSync('assets/internal-nav.js', 'utf8');

const required = [
  "sb.from('padoka_inventory')",
  "sb.from('padoka_production_plans')",
  "sb.from('padoka_losses')",
  "sb.rpc('padoka_adjust_inventory'",
  "sb.rpc('padoka_update_inventory_metadata'",
  "sb.rpc('padoka_upsert_production_plan'",
  "sb.rpc('padoka_register_loss'",
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

if (/localStorage|sessionStorage/.test(sync)) {
  throw new Error('Operational sync não pode persistir estoque, produção ou perdas no navegador.');
}

if (/byId\s*=\s*Object\.fromEntries\(catalog\.map/.test(sync)) {
  throw new Error('Operational sync não pode congelar o índice do catálogo antes do carregamento assíncrono.');
}

if (!sync.includes("if($('app')?.classList.contains('hidden'))return")) {
  throw new Error('Operational sync deve aguardar a área interna autenticada antes de iniciar.');
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

if (!gestao.includes('Carregando dados operacionais seguros do servidor…')) {
  throw new Error('Gestão deve iniciar os módulos operacionais em estado visual bloqueado.');
}

console.log('Operational fail-closed audit: OK');
