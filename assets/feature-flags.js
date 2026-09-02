(()=>{
  'use strict';

  const PADOKA_ORIGIN='https://yncspxfsvlqdnodlsosb.supabase.co';
  const PUBLIC_FETCH_OPTIONS=Object.freeze({cache:'no-store',credentials:'omit',redirect:'error'});
  const EMPTY_FLAGS=()=>Object.create(null);
  const isSafeFlagKey=value=>typeof value==='string'&&/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(value)&&value!=='__proto__'&&value!=='prototype'&&value!=='constructor';
  window.PADOKA_FLAGS=Object.freeze(EMPTY_FLAGS());
  window.PADOKA_FLAG_CONFIG=Object.freeze(EMPTY_FLAGS());

  const apply=()=>{
    document.querySelectorAll('[data-feature]').forEach(el=>{
      const key=el.getAttribute('data-feature')||'';
      el.hidden=!window.PADOKA_FLAGS[key];
    });
  };

  function decodeJwtPayload(value){
    try{
      const part=String(value||'').split('.')[1]||'';
      const normalized=part.replace(/-/g,'+').replace(/_/g,'/');
      const padded=normalized+'='.repeat((4-normalized.length%4)%4);
      return JSON.parse(atob(padded));
    }catch{return null;}
  }

  function validPublicKey(value){
    if(typeof value!=='string'||value.length<=20)return false;
    return value.startsWith('sb_publishable_')||(value.startsWith('eyJ')&&decodeJwtPayload(value)?.role==='anon');
  }

  function validateConfig(value){
    if(!value||typeof value!=='object'||value.scope!=='padoka')throw new Error('PADOKA public config invalid');
    let url;
    try{url=new URL(String(value.url||''));}catch{throw new Error('PADOKA public config invalid backend');}
    if(url.origin!==PADOKA_ORIGIN||url.pathname!=='/')throw new Error('PADOKA public config backend mismatch');
    if(!validPublicKey(value.publishableKey))throw new Error('PADOKA public config key invalid');
    return {origin:PADOKA_ORIGIN,publishableKey:value.publishableKey};
  }

  async function load(){
    try{
      if(typeof window.PADOKA_RUNTIME?.getPublicConfig!=='function')throw new Error('PADOKA runtime unavailable');
      const cfg=validateConfig(await window.PADOKA_RUNTIME.getPublicConfig());
      const url=cfg.origin+'/rest/v1/padoka_feature_flags?select=key,enabled,config&audience=eq.public';
      const response=await fetch(url,{...PUBLIC_FETCH_OPTIONS,headers:{Accept:'application/json',apikey:cfg.publishableKey}});
      if(!response.ok)throw new Error('flags unavailable');
      const contentType=String(response.headers.get('content-type')||'').toLowerCase();
      if(!contentType.includes('application/json'))throw new Error('flags invalid content type');
      const rows=await response.json(),flags=EMPTY_FLAGS(),config=EMPTY_FLAGS();
      for(const row of rows||[]){
        if(!isSafeFlagKey(row?.key)){console.warn('PADOKA feature flag ignorada por chave inválida');continue;}
        flags[row.key]=row.enabled===true;
        config[row.key]=row.config&&typeof row.config==='object'&&!Array.isArray(row.config)?row.config:{};
      }
      window.PADOKA_FLAGS=Object.freeze(flags);
      window.PADOKA_FLAG_CONFIG=Object.freeze(config);
    }catch(error){
      console.warn('PADOKA feature flags fail-closed:',error);
    }finally{
      apply();
      dispatchEvent(new CustomEvent('padoka:flags-ready',{detail:{flags:window.PADOKA_FLAGS}}));
    }
  }

  window.PADOKA_FEATURES={enabled:key=>isSafeFlagKey(key)&&window.PADOKA_FLAGS[key]===true,config:key=>isSafeFlagKey(key)?window.PADOKA_FLAG_CONFIG[key]||{}:{},apply};
  load();
})();