(()=>{
'use strict';
const SUPABASE_URL='https://yncspxfsvlqdnodlsosb.supabase.co';
const $=id=>document.getElementById(id);
let sb=null,factorId='',returnTo='internal.html';

function setStatus(text,type=''){
  const el=$('status');
  if(!el)return;
  el.textContent=text;
  el.className='status'+(type?' '+type:'');
}

function safeReturn(){
  const raw=new URLSearchParams(location.search).get('return')||'internal.html';
  try{
    const u=new URL(raw,location.href);
    const name=u.pathname.split('/').pop();
    const allowed=new Set(['internal.html','pedidos.html','pdv.html','gestao.html','enterprise.html']);
    if(u.origin===location.origin&&allowed.has(name))return name+(name==='gestao.html'?u.search:'');
  }catch{}
  return 'internal.html';
}

function validLegacyAnonKey(value){
  if(!value.startsWith('eyJ'))return false;
  try{
    const part=value.split('.')[1]||'';
    const normalized=part.replace(/-/g,'+').replace(/_/g,'/');
    const padded=normalized+'='.repeat((4-normalized.length%4)%4);
    const payload=JSON.parse(atob(padded));
    return payload?.role==='anon';
  }catch{return false;}
}

function validPublicKey(value){
  return typeof value==='string'&&value.length>20&&(value.startsWith('sb_publishable_')||validLegacyAnonKey(value));
}

function validConfig(cfg){
  if(!cfg||cfg.scope!=='padoka'||!validPublicKey(cfg.publishableKey))return false;
  try{
    const url=new URL(String(cfg.url||''));
    return url.origin===SUPABASE_URL&&url.pathname==='/'&&url.search===''&&url.hash==='';
  }catch{return false;}
}

async function currentAal(){
  const {data,error}=await sb.auth.mfa.getAuthenticatorAssuranceLevel();
  if(error)throw error;
  return data;
}

async function start(){
  returnTo=safeReturn();
  try{
    const getPublicConfig=window.PADOKA_RUNTIME?.getPublicConfig;
    if(typeof getPublicConfig!=='function')throw new Error('PADOKA runtime unavailable');
    const cfg=await getPublicConfig();
    if(!validConfig(cfg))throw new Error('unexpected PADOKA backend');
    sb=window.supabase.createClient(SUPABASE_URL,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true}});

    const {data:{session},error:sErr}=await sb.auth.getSession();
    if(sErr||!session){location.replace('internal.html');return;}

    const {data:staff,error}=await sb.from('padoka_staff_users').select('role,active').eq('user_id',session.user.id).maybeSingle();
    if(error||!staff?.active){
      await sb.auth.signOut();
      location.replace('internal.html');
      return;
    }

    const role=String(staff.role||'').toLowerCase();
    if(!['owner','manager'].includes(role)){location.replace(returnTo);return;}

    const aal=await currentAal();
    if(aal?.currentLevel==='aal2'){location.replace(returnTo);return;}

    const {data:factors,error:fErr}=await sb.auth.mfa.listFactors();
    if(fErr)throw fErr;
    const verified=(factors?.totp||[]).find(f=>f.status==='verified');
    if(verified){
      factorId=verified.id;
      $('verify')?.classList.remove('hidden');
      setStatus('Abra seu aplicativo autenticador e informe o código atual.');
      return;
    }

    for(const f of factors?.totp||[]){
      if(f.status!=='verified')try{await sb.auth.mfa.unenroll({factorId:f.id});}catch{}
    }

    const {data:enroll,error:eErr}=await sb.auth.mfa.enroll({factorType:'totp',friendlyName:'PADOKA Admin'});
    if(eErr)throw eErr;
    factorId=enroll.id;
    $('qr').src=enroll.totp.qr_code;
    $('secret').textContent='Chave manual: '+enroll.totp.secret;
    $('setup')?.classList.remove('hidden');
    $('verify')?.classList.remove('hidden');
    setStatus('Configure o autenticador e confirme o primeiro código.');
  }catch(error){
    console.error(error);
    setStatus('Não foi possível iniciar a verificação em duas etapas. Saia e tente novamente.','error');
  }
}

$('verifyBtn')?.addEventListener('click',async()=>{
  const code=$('code').value.replace(/\D/g,'').slice(0,6);
  if(code.length!==6){setStatus('Digite os 6 números exibidos no autenticador.','error');return;}
  const btn=$('verifyBtn');
  btn.disabled=true;
  try{
    setStatus('Confirmando…');
    const {data:challenge,error:cErr}=await sb.auth.mfa.challenge({factorId});
    if(cErr)throw cErr;
    const {error:vErr}=await sb.auth.mfa.verify({factorId,challengeId:challenge.id,code});
    if(vErr)throw vErr;
    const aal=await currentAal();
    if(aal?.currentLevel!=='aal2')throw new Error('aal2 not reached');
    setStatus('Verificação concluída. Abrindo o painel…','ok');
    location.replace(returnTo);
  }catch(error){
    console.error(error);
    setStatus('Código inválido ou expirado. Confira o autenticador e tente novamente.','error');
  }finally{btn.disabled=false;}
});

$('code')?.addEventListener('input',event=>{event.target.value=event.target.value.replace(/\D/g,'').slice(0,6);});
$('code')?.addEventListener('keydown',event=>{if(event.key==='Enter')$('verifyBtn')?.click();});
$('logout')?.addEventListener('click',async()=>{try{if(sb)await sb.auth.signOut();}finally{location.replace('internal.html');}});

start();
})();