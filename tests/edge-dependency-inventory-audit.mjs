import fs from 'node:fs';

const inventory=JSON.parse(fs.readFileSync('supabase/edge-dependencies.json','utf8'));
const functions=Object.keys(inventory.functions);
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};

for(const name of functions){
  const source=fs.readFileSync('supabase/functions/'+name+'/index.ts','utf8');
  const imports=[...source.matchAll(/(?:from\s+|import\s+)["']([^"']+)["']/g)].map(m=>m[1]);
  const expected=inventory.functions[name];
  for(const ref of imports){
    if(ref.startsWith('npm:')&&!/@\d+(?:\.\d+){2}(?:\/|$)/.test(ref))fail(name+': npm import não fixado: '+ref);
    if(ref.startsWith('jsr:')&&!/@\d+(?:\.\d+){2}(?:\/|$)/.test(ref))fail(name+': jsr import não fixado: '+ref);
  }
  const a=[...imports].sort(),b=[...expected].sort();
  if(JSON.stringify(a)!==JSON.stringify(b))fail(name+': inventário divergiu do código');
}
if(!inventory.functions['padoka-push']?.includes('npm:@mmmike/web-push@1.3.0/send'))fail('Push: web-push não está inventariado');
if(!process.exitCode)console.log('Edge dependency inventory audit: OK');
