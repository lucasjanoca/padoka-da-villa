import fs from 'node:fs';

const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
if(fs.existsSync('.nojekyll'))fail('.nojekyll não pode existir: ele ignoraria as exclusões de segurança do Jekyll');
if(!fs.existsSync('_config.yml'))fail('_config.yml ausente');
const cfg=fs.readFileSync('_config.yml','utf8');
for(const item of ['.github','AUTH_STATUS.md','CHANGELOG.d','DEPLOYMENT.md','PIX_SETUP_CHECKLIST.md','README.md','SECURITY.md','supabase','tests','docs']){
  if(!cfg.includes('  - '+item+'\n'))fail('_config.yml não exclui '+item);
}
for(const publicFile of ['index.html','produto.html','conta.html','pagamento.html','acompanhamento.html','internal.html','pedidos.html','pdv.html','gestao.html','mfa.html','enterprise.html','club.html','club-admin.html','assets','manifest.webmanifest','robots.txt','sitemap.xml','vendor']){
  if(cfg.includes('  - '+publicFile+'\n'))fail('_config.yml exclui recurso público necessário: '+publicFile);
}
if(!process.exitCode)console.log('Pages publish surface audit: OK');
