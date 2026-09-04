(()=>{
'use strict';

// A verificação TOTP/MFA foi removida da PADOKA. Mantemos esta rota apenas
// como compatibilidade para favoritos, cache e links antigos, redirecionando
// sempre para uma área administrativa válida.
function safeReturn(){
  const raw=new URLSearchParams(location.search).get('return')||'internal.html';
  try{
    const u=new URL(raw,location.href);
    const name=u.pathname.split('/').pop();
    const allowed=new Set(['internal.html','pedidos.html','pdv.html','gestao.html','enterprise.html','club-admin.html']);
    if(u.origin===location.origin&&allowed.has(name)){
      return name+(name==='gestao.html'?u.search:'');
    }
  }catch{}
  return 'internal.html';
}

location.replace(safeReturn());
})();
