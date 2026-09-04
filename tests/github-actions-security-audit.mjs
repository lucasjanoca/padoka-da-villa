import fs from 'node:fs';
import path from 'node:path';

const dir = '.github/workflows';
const files = fs.readdirSync(dir).filter((name) => /\.ya?ml$/i.test(name)).sort();
const failures = [];
const fail = (message) => failures.push(message);

if (files.length === 0) fail('nenhum workflow encontrado');

for (const file of files) {
  const source = fs.readFileSync(path.join(dir, file), 'utf8');

  if (/^\s*pull_request_target\s*:/m.test(source)) {
    fail(`${file}: pull_request_target não é permitido`);
  }

  if (!/^permissions\s*:/m.test(source)) {
    fail(`${file}: permissions deve ser declarado explicitamente`);
  }

  if (/^permissions\s*:\s*write-all\s*$/mi.test(source)) {
    fail(`${file}: permissions write-all é proibido`);
  }

  for (const match of source.matchAll(/^\s*-?\s*uses:\s*([^\s#]+)(?:\s+#.*)?$/gmi)) {
    const action = match[1];
    if (action.startsWith('./') || action.startsWith('docker://')) continue;

    const at = action.lastIndexOf('@');
    if (at < 0) {
      fail(`${file}: action sem referência fixa: ${action}`);
      continue;
    }

    const version = action.slice(at + 1);
    if (!/^[0-9a-f]{40}$/i.test(version)) {
      fail(`${file}: action não pinada em SHA completo: ${action}`);
    }
  }

  if (/\bservice_role\b|sb_secret_[A-Za-z0-9_-]+/i.test(source)) {
    fail(`${file}: segredo administrativo não deve aparecer no workflow`);
  }
}

const codeql = fs.readFileSync('.github/workflows/codeql.yml', 'utf8');
if (!/security-events:\s*write/.test(codeql)) fail('CodeQL precisa publicar resultados de segurança');
if (!/queries:\s*security-extended/.test(codeql)) fail('CodeQL deve usar security-extended');

const dependabot = fs.readFileSync('.github/dependabot.yml', 'utf8');
if (!/package-ecosystem:\s*github-actions/.test(dependabot)) fail('Dependabot para GitHub Actions ausente');

if (failures.length > 0) {
  console.error('Falhas na auditoria de segurança dos workflows:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`GitHub Actions supply-chain audit: OK (${files.length} workflows)`);
