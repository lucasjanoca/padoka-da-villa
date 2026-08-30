import fs from 'node:fs';

const sync = fs.readFileSync(new URL('../assets/operational-sync.js', import.meta.url), 'utf8');
const failures = [];
const ok = (cond, msg) => { if (!cond) failures.push(msg); };

ok(sync.includes("PADOKA_TIME_ZONE='America/Sao_Paulo'"), 'operational-sync.js: fuso operacional da padaria não está explícito');
ok(/toLocaleDateString\('en-CA',\{timeZone:PADOKA_TIME_ZONE\}\)/.test(sync), 'operational-sync.js: data operacional ainda depende do fuso local do aparelho');
ok(/padoka_production_plans[\s\S]*?\.eq\('plan_date',today\(\)\)/.test(sync), 'operational-sync.js: leitura do plano de produção não usa a data operacional da padaria');
ok(/padoka_upsert_production_plan[\s\S]*?p_plan_date:today\(\)/.test(sync), 'operational-sync.js: gravação do plano de produção não usa a data operacional da padaria');

if (failures.length) {
  console.error(`PADOKA operational timezone audit: ${failures.length} falha(s)`);
  failures.forEach(x => console.error(`- ${x}`));
  process.exit(1);
}
console.log('PADOKA operational timezone audit: OK');
