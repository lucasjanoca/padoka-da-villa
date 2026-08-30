import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const skip=new Set(['.git']);
const extensions=new Set(['.html','.js','.mjs','.ts','.sql','.md','.yml','.yaml','.json','.txt','.css']);
const failures=[];
const walk=dir=>{
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(skip.has(entry.name))continue;
    const full=path.join(dir,entry.name);
    if(entry.isDirectory())walk(full);
    else if(extensions.has(path.extname(entry.name).toLowerCase())){
      const rel=path.relative(root,full).replaceAll('\\','/');
      const source=fs.readFileSync(full,'utf8');
      if(/sb_secret_[A-Za-z0-9_-]{12,}/.test(source))failures.push(rel+': chave sb_secret_ literal detectada');
      if(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(source))failures.push(rel+': chave privada PEM detectada');
      if(/\b(?:sk_live|rk_live)_[A-Za-z0-9_-]{12,}/.test(source))failures.push(rel+': segredo de pagamento com aparência real detectado');
      for(const match of source.matchAll(/\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\b/g)){
        failures.push(rel+': JWT literal detectado em código/versionamento');
      }
    }
  }
};
walk(root);
if(failures.length){
  console.error('Secret scan audit: '+failures.length+' falha(s)');
  failures.forEach(x=>console.error('- '+x));
  process.exit(1);
}
console.log('Secret scan audit: OK');
