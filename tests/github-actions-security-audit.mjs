import fs from 'node:fs';
import path from 'node:path';

const dir='.github/workflows';
const files=fs.readdirSync(dir).filter(x=>/\.ya?ml$/i.test(x));
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};

for(const file of files){
  const source=fs.readFileSync(path.join(dir,file),'utf8');
  if(/permissions:\s*write-all/i.test(source))fail(file+': permissions write-all proibido');
  for(const m of source.matchAll(/^\s*uses:\s*([^\s#]+)(?:\s+#.*)?$/gmi)){
    const ref=m[1];
    if(ref.startsWith('./'))continue;
    const at=ref.lastIndexOf('@');
    if(at<0){fail(file+': action sem referência fixa: '+ref);continue}
    const version=ref.slice(at+1);
    if(!/^[0-9a-f]{40}$/i.test(version))fail(file+': action não pinada em SHA completo: '+ref);
  }
}

const codeql=fs.readFileSync('.github/workflows/codeql.yml','utf8');
if(!/security-events:\s*write/.test(codeql))fail('CodeQL precisa publicar resultados de segurança');
if(!/queries:\s*security-extended/.test(codeql))fail('CodeQL deve usar security-extended');

const dependabot=fs.readFileSync('.github/dependabot.yml','utf8');
if(!/package-ecosystem:\s*github-actions/.test(dependabot))fail('Dependabot para GitHub Actions ausente');

if(!process.exitCode)console.log('GitHub Actions supply-chain audit: OK');
