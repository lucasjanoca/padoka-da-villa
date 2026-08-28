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
  ['leitura física é bloqueada durante venda pendente, revalidação ou câmera aberta', /scannerInput\.disabled\|\|cameraIsOpen\(\)\|\|!scannerUserId\|\|staffGuardPending\(\)/.test(scanner)],
  ['leitor limita códigos anormalmente longos', /MAX_SCANNER_CODE_LENGTH=64/.test(scanner)&&/raw\.length>MAX_SCANNER_CODE_LENGTH/.test(scanner)&&/hardwareBuffer\.length>=MAX_SCANNER_CODE_LENGTH/.test(scanner)],
  ['leitura acima do limite é descartada sem truncar código', /rejectOversizedRead\(\).*scannerInput\.value=''/s.test(scanner)],
  ['códigos do leitor são atualizados pela RPC do servidor', /sb\.rpc\('padoka_list_product_barcodes'\)/.test(scanner)],
  ['frontend não mantém tabela fixa de códigos demonstrativos', !/TEST_BARCODES/.test(scanner)],
  ['falha ao atualizar códigos do servidor não inventa fallback local', /if\(error\)throw error/.test(scanner)&&!/TEST_BARCODES\[product\.id\]/.test(scanner)],
  ['produto sem código retornado pelo servidor fica sem barcode local', /barcode:fromDb\.get\(String\(product\.id\)\)\|\|null/.test(scanner)&&!/barcode:fromDb\.get\(String\(product\.id\)\)\|\|normalize\(product\.barcode\)/.test(scanner)],
  ['PDV identifica quando os códigos cadastrados ainda são demonstrativos', /DEMO_BARCODE_PATTERN/.test(scanner)&&/códigos cadastrados ainda são demonstrativos/.test(scanner)],
  ['leitor acompanha troca de autenticação do funcionário', /auth\.onAuthStateChange/.test(scanner)&&/resetScannerForIdentityChange/.test(scanner)&&/activateScannerForUser/.test(scanner)],
  ['resposta atrasada do catálogo de códigos é invalidada pelo lifecycle', /scannerLifecycleEpoch/.test(scanner)&&/scannerContextCurrent\(expectedEpoch,expectedUserId\)/.test(scanner)&&/session\?\.user\?\.id!==expectedUserId/.test(scanner)],
  ['troca de identidade limpa códigos locais antes de revalidar o novo staff', /resetScannerForIdentityChange[\s\S]*clearLocalBarcodes\(\)/.test(scanner)&&/barcode:null/.test(scanner)],
  ['câmera não abre depois de troca de identidade durante refresh', /openCamera=async function[\s\S]*scannerContextCurrent\(epoch,userId\)[\s\S]*await refreshBarcodes\(epoch,userId\)[\s\S]*scannerContextCurrent\(epoch,userId\)/.test(scanner)],
  ['o cache-buster do loader aponta para a revisão atual do leitor físico', /pdv-scanner-fix\.js\?v=2026082801/.test(loader)],
];

for (const [label, passed] of checks) {
  if (!passed) fail(label);
  else ok(label);
}

if (!process.exitCode) console.log('\nPADOKA hardware scanner audit: OK');
