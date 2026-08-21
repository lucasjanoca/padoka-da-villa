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
  const missingListRpc=error=>['PGRST202','42883'].includes(String(error?.code||''))||/padoka_list_staff|function .* does not exist|schema cache/i.test(String(error?.message||''));
  const missingEnrollmentRpc=error=>['PGRST202','42883'].includes(String(error?.code||''))||/padoka_add_staff_by_email|function .* does not exist|schema cache/i.test(String(error?.message||''));
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const currentTab=()=>new URLSearchParams(location.search).get('tab')||'produtos';
  let client=null,currentUserId='',channel=null,staff=[],enrollmentAvailable=false,enrolling=false;

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
      .staff-enroll{border:1px solid var(--line);border-radius:16px;padding:13px;background:#faf8f5;margin-bottom:10px}.staff-enroll h3{margin:0 0 4px;font-size:13px}.staff-enroll p{margin:0;color:var(--muted);font-size:9px;line-height:1.45}.staff-enroll-form{display:grid;grid-template-columns:minmax(190px,1fr) minmax(140px,.55fr) auto;gap:8px;margin-top:10px}.staff-enroll-form input,.staff-enroll-form select{border:1px solid var(--line);border-radius:10px;padding:10px;background:#fff;font-size:9.5px}.staff-enroll-form button{border:0;border-radius:10px;padding:10px 12px;background:var(--dark);color:#fff;font-size:9px;font-weight:950}.staff-enroll-form button:disabled{opacity:.5}.staff-enroll-msg{min-height:16px;margin-top:7px!important;font-weight:850}.staff-enroll-msg.ok{color:#285b3e}.staff-enroll-msg.error{color:#873f35}
      .staff-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-bottom:10px}
      .staff-summary>div{border:1px solid var(--line);border-radius:14px;padding:12px;background:#faf8f5}
      .staff-summary small{display:block;font-size:8px;color:var(--muted);font-weight:900}.staff-summary strong{display:block;font-size:21px;margin-top:5px}
      .staff-list{display:grid;gap:8px}.staff-row{border:1px solid var(--line);border-radius:15px;padding:12px;display:grid;grid-template-columns:minmax(190px,1.2fr) minmax(140px,.7fr) auto auto;gap:9px;align-items:center}
      .staff-id strong{display:block;font-size:11px}.staff-id small{display:block;color:var(--muted);font-size:8.5px;margin-top:3px;overflow-wrap:anywhere}.staff-role{border:1px solid var(--line);border-radius:10px;padding:9px;background:#fff;font-size:9.5px}.staff-active{display:flex;align-items:center;gap:6px;font-size:9px;font-weight:900}.staff-save{border:0;border-radius:10px;padding:9px 11px;background:var(--dark);color:#fff;font-size:9px;font-weight:950}.staff-save:disabled,.staff-role:disabled{opacity:.5}.staff-note{font-size:9px;color:var(--muted);line-height:1.45;margin-top:10px}
      @media(max-width:760px){.staff-enroll-form{grid-template-columns:1fr 1fr}.staff-enroll-form button{grid-column:1/-1}.staff-row{grid-template-columns:1fr 1fr}.staff-id{grid-column:1/-1}.staff-save{width:100%}}
      @media(max-width:460px){.staff-enroll-form{grid-template-columns:1fr}.staff-enroll-form button{grid-column:auto}.staff-summary{grid-template-columns:1fr}.staff-row{grid-template-columns:1fr}.staff-id{grid-column:auto}.staff-active{padding:4px 0}}
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
    let drawerLink=document.querySelector('.padoka-nav-list [data-padoka-module="equipe"]');
    if(!drawerLink){
      drawerLink=document.createElement('a');
      drawerLink.href='gestao.html?tab=equipe';
      drawerLink.dataset.padokaModule='equipe';
      drawerLink.innerHTML='<span class="nav-ico">♙</span>Equipe';
      document.querySelector('.padoka-nav-list')?.appendChild(drawerLink);
    }
    let panel=document.querySelector('[data-panel="equipe"]');
    if(!panel){
      panel=document.createElement('section');
      panel.className='panel';
      panel.dataset.panel='equipe';
      panel.innerHTML='<div class="card"><div id="staffEnrollment"></div><div class="staff-summary" id="staffSummary"></div><div class="staff-list" id="staffList"></div><p class="staff-note">Funções e acessos são validados novamente no servidor. A inclusão de equipe apenas associa uma conta Auth já existente e nunca cria conta, senha ou perfil de cliente automaticamente.</p></div>';
      document.querySelector('main.wrap.page')?.appendChild(panel);
    }
    renderEnrollment();
    if(currentTab()==='equipe'){
      document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active',p===panel));
      document.querySelectorAll('.tabs .tab').forEach(a=>a.classList.toggle('active',a===tab));
      document.querySelectorAll('.padoka-nav-list a').forEach(a=>a.classList.toggle('active',a===drawerLink));
      const title=document.getElementById('title'),subtitle=document.getElementById('subtitle');
      if(title)title.textContent='Equipe';
      if(subtitle)subtitle.textContent='Funções e acessos internos da PADOKA.';
      const nav=document.getElementById('padokaInternalNav');
      if(nav)nav.dataset.current='equipe';
    }
  }

  function renderEnrollment(message='',type=''){
    const mount=document.getElementById('staffEnrollment');
    if(!mount)return;
    if(!enrollmentAvailable){mount.innerHTML='';return}
    mount.innerHTML=`<section class="staff-enroll"><h3>Adicionar funcionário</h3><p>Informe o e-mail de uma conta de autenticação que já exista. Esta ação não cria usuário nem perfil de cliente.</p><form class="staff-enroll-form" id="staffEnrollForm"><input id="staffEnrollEmail" type="email" maxlength="254" autocomplete="off" placeholder="email@exemplo.com" required><select id="staffEnrollRole">${roles.map(([value,label])=>`<option value="${value}" ${value==='attendant'?'selected':''}>${label}</option>`).join('')}</select><button id="staffEnrollButton" type="submit" ${enrolling?'disabled':''}>${enrolling?'Adicionando…':'Adicionar à equipe'}</button></form><p class="staff-enroll-msg ${type}">${esc(message)}</p></section>`;
    document.getElementById('staffEnrollForm')?.addEventListener('submit',addStaff);
  }

  function render(){
    const summary=document.getElementById('staffSummary'),list=document.getElementById('staffList');
    if(!summary||!list)return;
    const active=staff.filter(x=>x.active).length,owners=staff.filter(x=>x.active&&x.role==='owner').length;
    summary.innerHTML=`<div><small>EQUIPE</small><strong>${staff.length}</strong></div><div><small>ATIVOS</small><strong>${active}</strong></div><div><small>PROPRIETÁRIOS ATIVOS</small><strong>${owners}</strong></div>`;
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

  async function probeEnrollment(){
    const {error}=await client.rpc('padoka_add_staff_by_email',{p_email:'',p_role:'attendant'});
    if(!error)return true;
    if(missingEnrollmentRpc(error))return false;
    return true;
  }

  async function addStaff(event){
    event.preventDefault();
    if(enrolling||!enrollmentAvailable)return;
    const emailInput=document.getElementById('staffEnrollEmail'),roleInput=document.getElementById('staffEnrollRole');
    const email=String(emailInput?.value||'').trim().toLowerCase(),role=String(roleInput?.value||'');
    if(!emailInput?.checkValidity()){renderEnrollment('Informe um e-mail válido.','error');return}
    if(!roles.some(([value])=>value===role)){renderEnrollment('Selecione uma função válida.','error');return}
    enrolling=true;renderEnrollment();
    const {error}=await client.rpc('padoka_add_staff_by_email',{p_email:email,p_role:role});
    enrolling=false;
    if(error){
      const msg=String(error.message||'');
      if(missingEnrollmentRpc(error)){enrollmentAvailable=false;renderEnrollment();return}
      if(/auth user not found/i.test(msg))renderEnrollment('Essa conta de autenticação ainda não existe. A pessoa precisa ter uma conta válida antes de ser adicionada.','error');
      else if(/staff already exists/i.test(msg))renderEnrollment('Esse usuário já faz parte da equipe PADOKA.','error');
      else if(/invalid staff email/i.test(msg))renderEnrollment('Informe um e-mail válido.','error');
      else if(/owner permission/i.test(msg))renderEnrollment('Seu acesso não permite incluir funcionários.','error');
      else renderEnrollment('Não foi possível adicionar o funcionário agora.','error');
      return;
    }
    await load().catch(()=>{});
    renderEnrollment('Funcionário adicionado à equipe.','ok');
  }

  async function saveRow(row){
    if(!row)return;
    const id=row.dataset.staffRow,role=row.querySelector('[data-role]')?.value,active=!!row.querySelector('[data-active]')?.checked,button=row.querySelector('[data-save]');
    if(!id||!button||!roles.some(([value])=>value===role))return;
    button.disabled=true;button.textContent='Salvando…';
    const {error}=await client.rpc('padoka_update_staff',{p_user_id:id,p_role:role,p_active:active});
    if(error){
      console.warn('PADOKA staff update:',error);
      alert(/last active owner|último owner/i.test(String(error.message||''))?'A PADOKA precisa manter pelo menos um proprietário ativo.':'Não foi possível atualizar esse acesso.');
      await load().catch(()=>{});
      return;
    }
    await load();
  }

  async function init(){
    const context=await waitForContext();
    if(!context||context.role!=='owner'){
      if(currentTab()==='equipe')location.replace('internal.html');
      return;
    }
    client=context.client;
    const {data:{session}}=await client.auth.getSession();
    currentUserId=session?.user?.id||'';
    try{
      const {data,error}=await client.rpc('padoka_list_staff');
      if(error){
        if(missingListRpc(error)){
          if(currentTab()==='equipe')location.replace('gestao.html?tab=configuracoes');
          return;
        }
        throw error;
      }
      staff=(data||[]).map(x=>({user_id:String(x.user_id||''),display_name:String(x.display_name||''),email:String(x.email||''),role:String(x.role||''),active:!!x.active,created_at:x.created_at}));
      enrollmentAvailable=await probeEnrollment();
      ensureUI();render();
      channel=client.channel('padoka-staff-management-ui').on('postgres_changes',{event:'*',schema:'public',table:'padoka_staff_users'},()=>load().catch(()=>{})).subscribe();
    }catch(error){console.warn('PADOKA staff management:',error)}
  }

  init();
})();
