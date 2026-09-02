import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const runtimeFiles = ['index.html','produto.html','conta.html','pagamento.html','acompanhamento.html','internal.html','pedidos.html','pdv.html','gestao.html','mfa.html','enterprise.html'];
const assetsDir = new URL('assets/', root);
for (const name of fs.readdirSync(assetsDir)) if (name.endsWith('.js')) runtimeFiles.push(`assets/${name}`);
const migrationFiles = [];
for (const name of fs.readdirSync(new URL('supabase/', root))) if (name.endsWith('.sql')) migrationFiles.push(`supabase/${name}`);

const failures = [];
const ok = (cond, msg) => { if (!cond) failures.push(msg); };
const PADOKA_REF = 'yncspxfsvlqdnodlsosb';
const PADOKA_ORIGIN = `https://${PADOKA_REF}.supabase.co`;

// Public/browser runtime must never contain an administrative credential or point
// to a different Supabase project. Migration SQL is intentionally excluded from
// the literal service_role check: PostgreSQL migrations may safely REVOKE/GRANT
// functions to the built-in service_role database role without exposing a key.
for (const rel of runtimeFiles) {
  const source = fs.readFileSync(new URL(rel, root), 'utf8');
  ok(!/service_role/i.test(source), `${rel}: service_role não pode aparecer em código/runtime público da PADOKA`);
  for (const match of source.matchAll(/https:\/\/([a-z0-9]{20})\.supabase\.co/gi)) {
    ok(match[1] === PADOKA_REF, `${rel}: aponta para Supabase diferente do backend PADOKA (${match[1]})`);
  }
}

// Public config is allowed to transport a publishable key, but consumers that use
// it must validate the complete PADOKA contract before issuing backend requests.
const featureFlags = fs.readFileSync(new URL('assets/feature-flags.js', root), 'utf8');
ok(featureFlags.includes(`const PADOKA_ORIGIN='${PADOKA_ORIGIN}'`), 'assets/feature-flags.js: origem PADOKA precisa estar fixada');
ok(/value\.scope!=='padoka'/.test(featureFlags), 'assets/feature-flags.js: configuração precisa permanecer limitada ao escopo PADOKA');
ok(/url\.origin!==PADOKA_ORIGIN\|\|url\.pathname!=='\/'/.test(featureFlags), 'assets/feature-flags.js: backend precisa ser validado contra a raiz exata da PADOKA');
ok(/const cfg=validateConfig\(await window\.PADOKA_RUNTIME\.getPublicConfig\(\)\)/.test(featureFlags), 'assets/feature-flags.js: configuração do runtime precisa ser validada antes do uso');
ok(/return \{origin:PADOKA_ORIGIN,publishableKey:value\.publishableKey\}/.test(featureFlags), 'assets/feature-flags.js: consultas devem usar somente a origem PADOKA validada');
ok(!/const url=cfg\.url\s*\+/.test(featureFlags), 'assets/feature-flags.js: acesso direto por cfg.url pode escapar do backend PADOKA');

// Migrations may document forbidden destinations (for example, "não aplicar no
// InfoTech.io") and may name PostgreSQL roles. What they must not do is embed a
// Supabase URL for another project.
for (const rel of migrationFiles) {
  const source = fs.readFileSync(new URL(rel, root), 'utf8');
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
console.log(`PADOKA backend isolation audit: OK (${runtimeFiles.length} runtimes + ${migrationFiles.length} migrations verificados)`);
