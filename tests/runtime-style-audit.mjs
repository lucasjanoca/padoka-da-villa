import fs from 'node:fs';

const files=fs.readdirSync('assets').filter(name=>name.endsWith('.js'));
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};

for(const file of files){
  const source=fs.readFileSync('assets/'+file,'utf8');
  if(/createElement\(\s*['"]style['"]\s*\)/.test(source))fail(file+': cria <style> dinamicamente');
  if(/\.style\s*\./.test(source))fail(file+': usa propriedade element.style');
  if(/setAttribute\(\s*['"]style['"]/.test(source))fail(file+': cria atributo style dinamicamente');
  if(/\.style\s*=/.test(source))fail(file+': atribui style dinamicamente');
}

const runtimeCss=fs.readFileSync('assets/runtime-security.css','utf8');
for(const token of ['.padoka-pwa-card','.padoka-notify','.padoka-staff-pending','body.padoka-body-lock','.padoka-fallback-applied']){
  if(!runtimeCss.includes(token))fail('runtime-security.css: regra esperada ausente '+token);
}

if(!process.exitCode)console.log('Runtime inline-style audit: OK');
