import fs from 'node:fs';

const fail = message => {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
};
const ok = message => console.log(`✓ ${message}`);
const scanner = fs.readFileSync('assets/pdv-scanner-fix.js', 'utf8');
const loader = fs.readFileSync('assets/pdv-idempotency.js', 'utf8');
const pdv = fs.readFileSync('pdv.html', 'utf8');

const checks = [
  ['PDV mantém envio por Enter no campo do leitor', /scanner'\)\.onkeydown=.*e\.key==='Enter'/s.test(pdv)],
  ['extensão reconhece Tab como sufixo de leitor físico', /event\.key==='Tab'.*submitHardwareCode/s.test(scanner)],
  ['extensão captura rajadas rápidas fora do campo do leitor', /document\.addEventListener\('keydown'.*hardwareBuffer/s.test(scanner)],
  ['extensão faz autoenvio quando o leitor não possui Enter/Tab', /MIN_AUTO_CODE_LENGTH.*armHardwareAutoCommit/s.test(scanner)],
  ['rajadas lentas não são tratadas como leitura automática', /HARDWARE_KEY_GAP_MS.*duration<=maxDuration/s.test(scanner)],
  ['leitura física é bloqueada durante venda pendente ou câmera aberta', /scannerInput\.disabled\|\|cameraIsOpen\(\)/.test(scanner)],
  ['o cache-buster do loader aponta para a revisão de leitor físico', /pdv-scanner-fix\.js\?v=2026082601/.test(loader)],
];

for (const [label, passed] of checks) {
  if (!passed) fail(label);
  else ok(label);
}

if (!process.exitCode) console.log('\nPADOKA hardware scanner audit: OK');
