(()=>{
  const PADOKA_ORIGIN='https://yncspxfsvlqdnodlsosb.supabase.co';
  const CONFIG_URL=PADOKA_ORIGIN+'/functions/v1/padoka-public-config';
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
  const requirePadokaOrigin=value=>{
    try{
      const url=new URL(String(value||''));
      if(url.origin!==PADOKA_ORIGIN)throw new Error('backend mismatch');
      return PADOKA_ORIGIN;
    }catch{
      throw new Error('PADOKA public config returned an invalid backend');
    }
  };
  async function load(){
    try{
      const cfg=window.PADOKA_RUNTIME?.getPublicConfig?await window.PADOKA_RUNTIME.getPublicConfig():await (async()=>{const r=await fetch(CONFIG_URL,{...PUBLIC_FETCH_OPTIONS,headers:{Accept:'application/json'}});if(!r.ok)throw new Error('config unavailable');return r.json()})();
      const origin=requirePadokaOrigin(cfg.url);
      if(typeof cfg.publishableKey!=='string'||!cfg.publishableKey.trim())throw new Error('publishable key unavailable');
      const url=origin+'/rest/v1/padoka_feature_flags?select=key,enabled,config&audience=eq.public';
      const f=await fetch(url,{...PUBLIC_FETCH_OPTIONS,headers:{Accept:'application/json',apikey:cfg.publishableKey}});
      if(!f.ok)throw new Error('flags unavailable');
      const rows=await f.json(),flags=EMPTY_FLAGS(),config=EMPTY_FLAGS();
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