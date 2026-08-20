import fs from 'node:fs';

const file='assets/production-completion.js';
const src=fs.readFileSync(file,'utf8');
const checks=[
  ['restrito à gestão',/gestao\.html/.test(src)],
  ['detecta a camada 006',/padoka_production_batches/.test(src)],
  ['usa RPC transacional',/rpc\('padoka_record_production'/.test(src)],
  ['gera request id idempotente',/crypto\.randomUUID\(\)/.test(src)&&/dataset\.requestId/.test(src)],
  ['não escreve estoque diretamente',!/(from\('padoka_inventory'\).*?(insert|update|upsert)|\.from\('padoka_inventory'\)\.update)/s.test(src)],
  ['não simula sucesso sem RPC',!/localStorage|padoka_demo_production/.test(src)],
  ['trata permissão sem expor detalhe técnico',/não tem permissão|Sem permissão/i.test(src)],
  ['carregamento interno inclui módulo',/production-completion\.js/.test(fs.readFileSync('assets/internal-nav.js','utf8'))]
];
let failed=0;
for(const [name,ok] of checks){console.log(`${ok?'✓':'✗'} ${name}`);if(!ok)failed++}
if(failed){console.error(`\n${failed} verificação(ões) falharam.`);process.exit(1)}
console.log('\nAuditoria do frontend de produção concluída.');
