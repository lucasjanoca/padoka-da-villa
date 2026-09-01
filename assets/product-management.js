(()=>{
  const isGestao=location.pathname.endsWith('/gestao.html')||location.pathname.endsWith('gestao.html');
  if(!isGestao)return;

  const PADOKA_SUPABASE_URL='https://yncspxfsvlqdnodlsosb.supabase.co';
  const esc=value=>String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const safeId=value=>/^[a-z0-9][a-z0-9_-]{0,79}$/i.test(String(value||'').trim());
  const missingRpc=error=>['PGRST202','42883'].includes(String(error?.code||''))||/padoka_list_products_admin|padoka_save_product|function .* does not exist|schema cache/i.test(String(error?.message||''));
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const isExpectedBackend=candidate=>!!candidate&&candidate.supabaseUrl===PADOKA_SUPABASE_URL;
  let client=null,role='',rows=[],saving=false,activeUserId='',lifecycleEpoch=0,realtimeChannel=null,authBound=false;

  async function waitForContext(){
    for(let i=0;i<80;i++){
      const candidate=window.padokaSupabase;
      if(candidate&&window.padokaStaffRole){
        if(!isExpectedBackend(candidate))return null;
        return {client:candidate,role:window.padokaStaffRole};
      }
      await sleep(100);
    }
    return null;
  }

  async function safeSession(){
    if(!client)return null;
    try{
      const {data,error}=await client.auth.getSession();
      if(error)throw error;
      return data?.session||null;
    }catch(error){
      console.warn('PADOKA product session check:',error);
      return null;
    }
  }

  async function sessionStillMatches(expectedUserId,expectedEpoch){
    if(!client||expectedEpoch!==lifecycleEpoch||!expectedUserId)return false;
    const session=await safeSession();
    return expectedEpoch===lifecycleEpoch&&session?.user?.id===expectedUserId;
  }

  function cleanupRealtime(){
    if(client&&realtimeChannel){
      try{client.removeChannel(realtimeChannel)}catch{}
    }
    realtimeChannel=null;
  }

  function resetForAuthChange(){
    lifecycleEpoch+=1;
    saving=false;
    activeUserId='';
    role='';
    rows=[];
    cleanupRealtime();
    document.getElementById('padokaProductAdmin')?.remove();
  }

  function bindAuthLifecycle(){
    if(authBound||!client)return;
    authBound=true;
    client.auth.onAuthStateChange((event,session)=>{
      if(event==='INITIAL_SESSION'||event==='TOKEN_REFRESHED')return;
      const nextUserId=session?.user?.id||'';
      if(nextUserId&&nextUserId===activeUserId&&event==='SIGNED_IN')return;
      resetForAuthChange();
      if(nextUserId)setTimeout(()=>init(),0);
    });
  }

  function mount(){
    const panel=document.querySelector('[data-panel="produtos"] .card');
    if(!panel||document.getElementById('padokaProductAdmin'))return;
    const section=document.createElement('section');
    section.className='product-admin';
    section.id='padokaProductAdmin';
    section.innerHTML='<div class="product-admin-head"><div><h3>Gerenciar catálogo</h3><p>Nome, categoria, preço, ordem e visibilidade vêm do servidor. Produtos provisórios devem continuar marcados até os dados oficiais serem confirmados.</p></div><button class="product-admin-new" id="padokaProductNew" type="button">Novo produto</button></div><div class="product-admin-message" id="padokaProductMessage"></div><div class="product-admin-list" id="padokaProductList"></div><div class="product-admin-note">Desativar um produto o remove do cardápio público sem apagar histórico. Novos produtos sem metadados visuais próprios usam temporariamente a logo PADOKA até foto/unidade/descrição serem cadastradas no frontend.</div>';
    panel.appendChild(section);
    document.getElementById('padokaProductNew').onclick=addBlank;
  }

  function message(text='',type=''){
    const el=document.getElementById('padokaProductMessage');
    if(!el)return;
    el.className=`product-admin-message ${type}`;
    el.textContent=text;
  }

  function normalize(row){
    return {
      id:String(row.id||''),name:String(row.name||''),category:String(row.category||''),
      price:Number(row.price||0),active:!!row.active,is_demo:row.is_demo!==false,
      sort_order:Number(row.sort_order||0),isNew:!!row.isNew
    };
  }

  function render(){
    const list=document.getElementById('padokaProductList');
    if(!list)return;
    list.innerHTML=rows.map((row,index)=>`<article class="product-admin-row" data-product-row="${index}"><input data-field="id" maxlength="80" value="${esc(row.id)}" ${row.isNew?'':'readonly'} placeholder="id-produto"><input data-field="name" maxlength="120" value="${esc(row.name)}" placeholder="Nome"><input data-field="category" maxlength="60" value="${esc(row.category)}" placeholder="Categoria"><input data-field="price" type="number" min="0" max="999999.99" step="0.01" value="${Number.isFinite(row.price)?row.price.toFixed(2):'0.00'}"><input data-field="sort_order" type="number" min="0" max="1000000" step="1" value="${Number.isFinite(row.sort_order)?Math.trunc(row.sort_order):0}"><div class="flags"><label><input data-field="active" type="checkbox" ${row.active?'checked':''}> Ativo</label><label><input data-field="is_demo" type="checkbox" ${row.is_demo?'checked':''}> Provisório</label></div><button class="product-admin-save" data-save type="button" ${saving?'disabled':''}>Salvar</button></article>`).join('')||'<div class="notice">Nenhum produto cadastrado.</div>';
    list.querySelectorAll('[data-save]').forEach(btn=>btn.onclick=()=>save(Number(btn.closest('[data-product-row]')?.dataset.productRow)));
  }

  function addBlank(){
    if(rows.some(x=>x.isNew)){message('Salve o novo produto que já está aberto antes de criar outro.','error');return}
    const nextOrder=rows.reduce((m,x)=>Math.max(m,Number(x.sort_order||0)),0)+10;
    rows.unshift(normalize({id:'',name:'',category:'',price:0,active:false,is_demo:true,sort_order:nextOrder,isNew:true}));
    render();
    document.querySelector('[data-product-row="0"] [data-field="id"]')?.focus();
  }

  function readRow(index){
    const el=document.querySelector(`[data-product-row="${index}"]`);
    if(!el)return null;
    const get=name=>el.querySelector(`[data-field="${name}"]`);
    return normalize({
      id:get('id')?.value.trim().toLowerCase(),name:get('name')?.value.trim(),category:get('category')?.value.trim(),
      price:Number(get('price')?.value),sort_order:Number(get('sort_order')?.value),
      active:!!get('active')?.checked,is_demo:!!get('is_demo')?.checked,isNew:rows[index]?.isNew
    });
  }

  async function save(index){
    if(saving||!activeUserId)return;
    const operationEpoch=lifecycleEpoch;
    const operationUserId=activeUserId;
    if(!await sessionStillMatches(operationUserId,operationEpoch))return;
    const row=readRow(index);if(!row)return;
    if(!safeId(row.id)){message('O ID deve usar apenas letras, números, hífen ou underline.','error');return}
    if(!row.name||row.name.length>120){message('Informe um nome de produto válido.','error');return}
    if(!row.category||row.category.length>60){message('Informe uma categoria válida.','error');return}
    if(!Number.isFinite(row.price)||row.price<0||row.price>999999.99){message('Informe um preço válido.','error');return}
    if(!Number.isInteger(row.sort_order)||row.sort_order<0||row.sort_order>1000000){message('Informe uma ordem válida.','error');return}
    if(!row.is_demo&&!confirm('Marcar este produto como oficial? Faça isso somente depois de confirmar nome e preço com a padaria.'))return;
    saving=true;render();message('Salvando…');
    const {error}=await client.rpc('padoka_save_product',{p_id:row.id,p_name:row.name,p_category:row.category,p_price:row.price,p_active:row.active,p_is_demo:row.is_demo,p_sort_order:row.sort_order});
    if(!await sessionStillMatches(operationUserId,operationEpoch))return;
    saving=false;
    if(error){
      if(missingRpc(error)){document.getElementById('padokaProductAdmin')?.remove();return}
      const raw=String(error.message||'');
      if(/permission required/i.test(raw))message('Seu acesso não permite alterar o catálogo.','error');
      else if(/invalid product/i.test(raw))message('Revise os dados do produto.','error');
      else message('Não foi possível salvar o produto agora.','error');
      render();return;
    }
    await load(operationEpoch,operationUserId);
    if(operationEpoch!==lifecycleEpoch||operationUserId!==activeUserId)return;
    message('Produto salvo no catálogo.','ok');
    window.dispatchEvent(new CustomEvent('padoka:product-admin-saved',{detail:{id:row.id}}));
  }

  async function load(expectedEpoch=lifecycleEpoch,expectedUserId=activeUserId){
    if(!expectedUserId||!await sessionStillMatches(expectedUserId,expectedEpoch))return false;
    const {data,error}=await client.rpc('padoka_list_products_admin');
    if(error)throw error;
    if(!await sessionStillMatches(expectedUserId,expectedEpoch))return false;
    rows=(data||[]).map(normalize);
    render();
    return true;
  }

  async function init(){
    const initEpoch=lifecycleEpoch;
    const context=await waitForContext();
    if(!context||!isExpectedBackend(context.client)||!['owner','manager'].includes(context.role)||initEpoch!==lifecycleEpoch)return;
    client=context.client;role=context.role;
    bindAuthLifecycle();
    const session=await safeSession();
    if(!session||initEpoch!==lifecycleEpoch)return;
    activeUserId=session.user.id;
    const loaded=await load(initEpoch,activeUserId).catch(error=>{
      if(!missingRpc(error))console.warn('PADOKA product management:',error);
      return false;
    });
    if(!loaded||initEpoch!==lifecycleEpoch)return;
    mount();render();
    cleanupRealtime();
    realtimeChannel=client.channel(`padoka-product-admin-ui-${activeUserId}`).on('postgres_changes',{event:'*',schema:'public',table:'padoka_products'},()=>{
      const eventEpoch=lifecycleEpoch,eventUserId=activeUserId;
      load(eventEpoch,eventUserId).catch(()=>{});
    }).subscribe();
  }

  init();
})();
