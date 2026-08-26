import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const textFiles = [];
const walk = dir => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
    if (entry.isDirectory()) walk(path);
    else if (/\.(?:html|js|mjs|sql|md|yml|yaml)$/i.test(entry.name)) textFiles.push(path);
  }
};
walk(root);

const failures = [];
const ok = (cond, msg) => { if (!cond) failures.push(msg); };
const PADOKA_REF = 'yncspxfsvlqdnodlsosb';
const allowedForeignMentions = new Set(['AUTH_STATUS.md']);

for (const url of textFiles) {
  const rel = decodeURIComponent(url.pathname.slice(root.pathname.length));
  const source = fs.readFileSync(url, 'utf8');

  ok(!/service_role/i.test(source) || /never|nunca|não|nao|must not|do not/i.test(source), `${rel}: possível referência utilizável a service_role`);

  for (const match of source.matchAll(/https:\/\/([a-z0-9]{20})\.supabase\.co/gi)) {
    ok(match[1] === PADOKA_REF, `${rel}: aponta para Supabase diferente do backend PADOKA (${match[1]})`);
  }

  if (!allowedForeignMentions.has(rel)) {
    ok(!/InfoTech\.io/i.test(source), `${rel}: referência ao projeto InfoTech.io fora da documentação de isolamento`);
  }
}

const auth = fs.readFileSync(new URL('AUTH_STATUS.md', root), 'utf8');
ok(auth.includes(`Sites De Clientes!\` (\`${PADOKA_REF}\`)`) || auth.includes(PADOKA_REF), 'AUTH_STATUS.md: backend PADOKA não está documentado');
ok(/InfoTech\.io não é usado pela PADOKA/i.test(auth), 'AUTH_STATUS.md: isolamento do InfoTech.io não está explícito');

if (failures.length) {
  console.error(`PADOKA backend isolation audit: ${failures.length} falha(s)`);
  failures.forEach(x => console.error(`- ${x}`));
  process.exit(1);
}
console.log(`PADOKA backend isolation audit: OK (${textFiles.length} arquivos verificados)`);
