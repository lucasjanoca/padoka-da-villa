(()=>{
  const isGestao=location.pathname.endsWith('/gestao.html')||location.pathname.endsWith('gestao.html');
  if(!isGestao)return;

  const esc=value=>String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const safeId=value=>/^[a-z0-9][a-z0-9_-]{0,79}$/i.test(String(value||'').trim());
  const missingRpc=error=>['PGRST202','42883'].includes(String(error?.code||''))||/padoka_list_products_admin|padoka_save_product|function .* does not exist|schema cache/i.test(String(error?.message||''));
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  let client=null,role='',rows=[],saving=false;

  async function waitForContext(){
    for(let i=0;i<80;i++){
      if(window.padokaSupabase&&window.padokaStaffRole)return {client:window.padokaSupabase,role:window.padokaStaffRole};
      await sleep(100);
    }
    return null;
  }

  function addStyles(){
    if(document.getElementById('padokaProductManagementStyle'))return;
    const style=document.createElement('style');
    style.id='padokaProductManagementStyle';
    style.textContent=`
      .product-admin{margin-top:12px;border-top:1px solid var(--line);padding-top:12px}.product-admin-head{display:flex;justify-content:space-between;gap:10px;align-items:end}.product-admin-head h3{margin:0;font-size:14px}.product-admin-head p{margin:3px 0 0;color:var(--muted);font-size:9px;line-height:1.4}.product-admin-new{border:0;border-radius:10px;padding:9px 11px;background:var(--dark);color:#fff;font-size:9px;font-weight:950}.product-admin-list{display:grid;gap:8px;margin-top:10px}.product-admin-row{border:1px solid var(--line);border-radius:14px;padding:11px;display:grid;grid-template-columns:minmax(150px,.9fr) minmax(180px,1.2fr) minmax(120px,.7fr) 105px 80px 80px auto;gap:7px;align-items:center;background:#fff}.product-admin-row input,.product-admin-row select{width:100%;border:1px solid var(--line);border-radius:9px;padding:8px;background:#fff;font-size:9px}.product-admin-row .flags{display:grid;gap:5px;font-size:8.5px;font-weight:850}.product-admin-row .flags label{display:flex;align-items:center;gap:5px}.product-admin-save{border:0;border-radius:9px;padding:9px 10px;background:var(--dark);color:#fff;font-size:8.5px;font-weight:950}.product-admin-save:disabled{opacity:.5}.product-admin-note{margin-top:9px;padding:9px 10px;border-radius:11px;background:#f8f4ef;border:1px solid var(--line);font-size:8.5px;color:var(--muted);line-height:1.45}.product-admin-message{min-height:18px;margin-top:7px;font-size:9px;font-weight:850}.product-admin-message.ok{color:#285b3e}.product-admin-message.error{color:#873f35}@media(max-width:1000px){.product-admin-row{grid-template-columns:1fr 1fr 1fr}.product-admin-row .flags,.product-admin-save{grid-column:auto}}@media(max-width:620px){.product-admin-head{align-items:start;flex-direction:column}.product-admin-new{width:100%}.product-admin-row{grid-template-columns:1fr 1fr}.product-admin-row [data-field="name"],.product-admin-row [data-field="id"]{grid-column:1/-1}.product-admin-save{grid-column:1/-1;width:100%}}@media(max-width:420px){.product-admin-row{grid-template-columns:1fr}.product-admin-row [data-field="name"],.product-admin-row [data-field="id"],.product-admin-save{grid-column:auto}}
    `;
    document.head.appendChild(style);
  }

  function mount(){
    addStyles();
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
    if(saving)return;
    const row=readRow(index);if(!row)return;
    if(!safeId(row.id)){message('O ID deve usar apenas letras, números, hífen ou underline.','error');return}
    if(!row.name||row.name.length>120){message('Informe um nome de produto válido.','error');return}
    if(!row.category||row.category.length>60){message('Informe uma categoria válida.','error');return}
    if(!Number.isFinite(row.price)||row.price<0||row.price>999999.99){message('Informe um preço válido.','error');return}
    if(!Number.isInteger(row.sort_order)||row.sort_order<0||row.sort_order>1000000){message('Informe uma ordem válida.','error');return}
    if(!row.is_demo&&!confirm('Marcar este produto como oficial? Faça isso somente depois de confirmar nome e preço com a padaria.'))return;
    saving=true;render();message('Salvando…');
    const {error}=await client.rpc('padoka_save_product',{p_id:row.id,p_name:row.name,p_category:row.category,p_price:row.price,p_active:row.active,p_is_demo:row.is_demo,p_sort_order:row.sort_order});
    saving=false;
    if(error){
      if(missingRpc(error)){document.getElementById('padokaProductAdmin')?.remove();return}
      const raw=String(error.message||'');
      if(/permission required/i.test(raw))message('Seu acesso não permite alterar o catálogo.','error');
      else if(/invalid product/i.test(raw))message('Revise os dados do produto.','error');
      else message('Não foi possível salvar o produto agora.','error');
      render();return;
    }
    await load();
    message('Produto salvo no catálogo.','ok');
    window.dispatchEvent(new CustomEvent('padoka:product-admin-saved',{detail:{id:row.id}}));
  }

  async function load(){
    const {data,error}=await client.rpc('padoka_list_products_admin');
    if(error)throw error;
    rows=(data||[]).map(normalize);
    render();
  }

  async function init(){
    const context=await waitForContext();
    if(!context||!['owner','manager'].includes(context.role))return;
    client=context.client;role=context.role;
    const {data,error}=await client.rpc('padoka_list_products_admin');
    if(error){if(!missingRpc(error))console.warn('PADOKA product management:',error);return}
    rows=(data||[]).map(normalize);
    mount();render();
    client.channel('padoka-product-admin-ui').on('postgres_changes',{event:'*',schema:'public',table:'padoka_products'},()=>load().catch(()=>{})).subscribe();
  }

  init();
})();
