import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const runtimeFiles = ['index.html','conta.html','pagamento.html','acompanhamento.html','internal.html','pedidos.html','pdv.html','gestao.html'];
const assetsDir = new URL('assets/', root);
for (const name of fs.readdirSync(assetsDir)) if (name.endsWith('.js')) runtimeFiles.push(`assets/${name}`);
for (const name of fs.readdirSync(new URL('supabase/', root))) if (name.endsWith('.sql')) runtimeFiles.push(`supabase/${name}`);

const failures = [];
const ok = (cond, msg) => { if (!cond) failures.push(msg); };
const PADOKA_REF = 'yncspxfsvlqdnodlsosb';

for (const rel of runtimeFiles) {
  const source = fs.readFileSync(new URL(rel, root), 'utf8');
  ok(!/service_role/i.test(source), `${rel}: service_role não pode aparecer em código/runtime da PADOKA`);
  ok(!/InfoTech\.io/i.test(source), `${rel}: referência ao projeto InfoTech.io em código/runtime da PADOKA`);
  for (const match of source.matchAll(/https:\/\/([a-z0-9]{20})\.supabase\.co/gi)) {
    ok(match[1] === PADOKA_REF, `${rel}: aponta para Supabase diferente do backend PADOKA (${match[1]})`);
  }
}

const auth = fs.readFileSync(new URL('AUTH_STATUS.md', root), 'utf8');
ok(auth.includes(PADOKA_REF), 'AUTH_STATUS.md: backend PADOKA não está documentado');
ok(/InfoTech\.io não é usado pela PADOKA/i.test(auth), 'AUTH_STATUS.md: isolamento do InfoTech.io não está explícito');

if (failures.length) {
  console.error(`PADOKA backend isolation audit: ${failures.length} falha(s)`);
  failures.forEach(x => console.error(`- ${x}`));
  process.exit(1);
}
console.log(`PADOKA backend isolation audit: OK (${runtimeFiles.length} arquivos verificados)`);
