import fs from 'node:fs';

const sync = fs.readFileSync('assets/operational-sync.js', 'utf8');

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
];

for (const marker of required) {
  if (!sync.includes(marker)) {
    throw new Error(`Operational sync perdeu proteção/integração obrigatória: ${marker}`);
  }
}

if (/localStorage|sessionStorage/.test(sync)) {
  throw new Error('Operational sync não pode persistir estoque, produção ou perdas no navegador.');
}

if (!sync.includes("if($('app')?.classList.contains('hidden'))return")) {
  throw new Error('Operational sync deve aguardar a área interna autenticada antes de iniciar.');
}

if (!sync.includes("lockOperationalUi('Carregando dados operacionais seguros do servidor…')")) {
  throw new Error('Interface operacional deve iniciar bloqueada até o backend seguro carregar.');
}

console.log('Operational fail-closed audit: OK');
