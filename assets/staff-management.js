(()=>{
  const isGestao=location.pathname.endsWith('/gestao.html')||location.pathname.endsWith('gestao.html');
  if(!isGestao)return;

  const roles=[
    ['owner','Proprietário'],
    ['manager','Gerente'],
    ['cashier','Caixa'],
    ['attendant','Atendimento'],
    ['production','Produção'],
    ['stock','Estoque']
  ];
  const esc=value=>String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const missingRpc=error=>['PGRST202','42883'].includes(String(error?.code||''))||/padoka_list_staff|function .* does not exist|schema cache/i.test(String(error?.message||''));
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  let client=null,currentUserId='',channel=null,staff=[];

  async function waitForContext(){
    for(let i=0;i<80;i++){
      if(window.padokaSupabase&&window.padokaStaffRole)return {client:window.padokaSupabase,role:window.padokaStaffRole};
      await sleep(100);
    }
    return null;
  }

  function addStyles(){
    if(document.getElementById('padokaStaffManagementStyle'))return;
    const style=document.createElement('style');
    style.id='padokaStaffManagementStyle';
    style.textContent=`
      .staff-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-bottom:10px}
      .staff-summary>div{border:1px solid var(--line);border-radius:14px;padding:12px;background:#faf8f5}
      .staff-summary small{display:block;font-size:8px;color:var(--muted);font-weight:900}.staff-summary strong{display:block;font-size:21px;margin-top:5px}
      .staff-list{display:grid;gap:8px}.staff-row{border:1px solid var(--line);border-radius:15px;padding:12px;display:grid;grid-template-columns:minmax(190px,1.2fr) minmax(140px,.7fr) auto auto;gap:9px;align-items:center}
      .staff-id strong{display:block;font-size:11px}.staff-id small{display:block;color:var(--muted);font-size:8.5px;margin-top:3px;overflow-wrap:anywhere}.staff-role{border:1px solid var(--line);border-radius:10px;padding:9px;background:#fff;font-size:9.5px}.staff-active{display:flex;align-items:center;gap:6px;font-size:9px;font-weight:900}.staff-save{border:0;border-radius:10px;padding:9px 11px;background:var(--dark);color:#fff;font-size:9px;font-weight:950}.staff-save:disabled,.staff-role:disabled{opacity:.5}.staff-note{font-size:9px;color:var(--muted);line-height:1.45;margin-top:10px}
      @media(max-width:760px){.staff-row{grid-template-columns:1fr 1fr}.staff-id{grid-column:1/-1}.staff-save{width:100%}}
      @media(max-width:460px){.staff-summary{grid-template-columns:1fr}.staff-row{grid-template-columns:1fr}.staff-id{grid-column:auto}.staff-active{padding:4px 0}}
    `;
    document.head.appendChild(style);
  }

  function ensureUI(){
    addStyles();
    let tab=document.querySelector('.tabs a[href="?tab=equipe"]');
    if(!tab){
      tab=document.createElement('a');
      tab.className='tab';
      tab.href='?tab=equipe';
      tab.textContent='Equipe';
      document.getElementById('tabs')?.appendChild(tab);
    }
    let panel=document.querySelector('[data-panel="equipe"]');
    if(!panel){
      panel=document.createElement('section');
      panel.className='panel';
      panel.dataset.panel='equipe';
      panel.innerHTML='<div class="card"><div class="staff-summary" id="staffSummary"></div><div class="staff-list" id="staffList"></div><p class="staff-note">Alterações de função e acesso são auditadas pelo usuário autenticado e validadas novamente no servidor. Novos funcionários não são criados por esta tela.</p></div>';
      document.querySelector('main.wrap.page')?.appendChild(panel);
    }
    if(new URLSearchParams(location.search).get('tab')==='equipe'){
      document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active',p===panel));
      document.querySelectorAll('.tabs .tab').forEach(a=>a.classList.toggle('active',a===tab));
      const title=document.getElementById('title'),subtitle=document.getElementById('subtitle');
      if(title)title.textContent='Equipe';
      if(subtitle)subtitle.textContent='Funções e acessos internos da PADOKA.';
      const nav=document.getElementById('padokaInternalNav');
      if(nav)nav.dataset.current='equipe';
    }
  }

  function render(){
    const summary=document.getElementById('staffSummary'),list=document.getElementById('staffList');
    if(!summary||!list)return;
    const active=staff.filter(x=>x.active).length,owners=staff.filter(x=>x.active&&x.role==='owner').length;
    summary.innerHTML=`<div><small>EQUIPE</small><strong>${staff.length}</strong></div><div><small>ATIVOS</small><strong>${active}</strong></div><div><small>OWNERS ATIVOS</small><strong>${owners}</strong></div>`;
    if(!staff.length){list.innerHTML='<div class="notice">Nenhum funcionário cadastrado.</div>';return}
    list.innerHTML=staff.map(row=>{
      const self=row.user_id===currentUserId;
      return `<article class="staff-row" data-staff-row="${esc(row.user_id)}"><div class="staff-id"><strong>${esc(row.display_name||'Funcionário')}${self?' • Você':''}</strong><small>${esc(row.email||row.user_id)}</small></div><select class="staff-role" data-role ${self?'disabled':''}>${roles.map(([value,label])=>`<option value="${value}" ${row.role===value?'selected':''}>${label}</option>`).join('')}</select><label class="staff-active"><input data-active type="checkbox" ${row.active?'checked':''} ${self?'disabled':''}> Acesso ativo</label><button class="staff-save" data-save type="button" ${self?'disabled':''}>Salvar</button></article>`
    }).join('');
    list.querySelectorAll('[data-save]').forEach(button=>button.onclick=()=>saveRow(button.closest('[data-staff-row]')));
  }

  async function load(){
    const {data,error}=await client.rpc('padoka_list_staff');
    if(error)throw error;
    staff=(data||[]).map(x=>({
      user_id:String(x.user_id||''),display_name:String(x.display_name||''),email:String(x.email||''),role:String(x.role||''),active:!!x.active,created_at:x.created_at
    }));
    render();
  }

  async function saveRow(row){
    if(!row)return;
    const id=row.dataset.staffRow,role=row.querySelector('[data-role]')?.value,active=!!row.querySelector('[data-active]')?.checked,button=row.querySelector('[data-save]');
    if(!id||!roles.some(([value])=>value===role))return;
    button.disabled=true;button.textContent='Salvando…';
    const {error}=await client.rpc('padoka_update_staff',{p_user_id:id,p_role:role,p_active:active});
    if(error){
      console.warn('PADOKA staff update:',error);
      alert(/last active owner|último owner/i.test(String(error.message||''))?'A PADOKA precisa manter pelo menos um proprietário ativo.':'Não foi possível atualizar esse acesso.');
      await load().catch(()=>{});
    }else{
      await load();
    }
    button.disabled=false;button.textContent='Salvar';
  }

  async function init(){
    const context=await waitForContext();
    if(!context||context.role!=='owner'){
      if(new URLSearchParams(location.search).get('tab')==='equipe')location.replace('internal.html');
      return;
    }
    client=context.client;
    const {data:{session}}=await client.auth.getSession();
    currentUserId=session?.user?.id||'';
    try{
      const {data,error}=await client.rpc('padoka_list_staff');
      if(error){if(missingRpc(error))return;throw error}
      staff=(data||[]).map(x=>({user_id:String(x.user_id||''),display_name:String(x.display_name||''),email:String(x.email||''),role:String(x.role||''),active:!!x.active,created_at:x.created_at}));
      ensureUI();render();
      channel=client.channel('padoka-staff-management-ui').on('postgres_changes',{event:'*',schema:'public',table:'padoka_staff_users'},()=>load().catch(()=>{})).subscribe();
    }catch(error){console.warn('PADOKA staff management:',error)}
  }

  init();
})();
