(()=>{
const visual=[
{id:'pao-frances',unit:'100 g',desc:'Pão francês de fornada, crocante por fora e macio por dentro.',img:'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=82',tag:'Fornada'},
{id:'pao-queijo',unit:'100 g',desc:'Pão de queijo dourado, macio e com textura puxenta.',img:'https://www.em.com.br/emfoco/wp-content/uploads/2025/05/pao-de-queijo_1746803532280.jpg',tag:'Popular'},
{id:'croissant',unit:'100 g',desc:'Croissant de massa folhada, leve e dourada.',img:'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=82',tag:'Destaque'},
{id:'croissant-recheado',unit:'100 g',desc:'Croissant folhado com recheio salgado cremoso.',img:'https://guiadacozinha.com.br/wp-content/uploads/2020/01/croissant-presunto-e-queijo.jpg',tag:'Recheado'},
{id:'coxinha',unit:'100 g',desc:'Coxinha dourada com recheio cremoso de frango.',img:'https://static.itdg.com.br/images/640-auto/bb75831b4a113d546904f50ca3cad1c1/coxinha-baixa.jpg',tag:'Mais pedido'},
{id:'esfiha',unit:'100 g',desc:'Esfiha assada com massa macia e recheio bem temperado.',img:'https://recipesblob.oetker.com.br/assets/0b7a266463ca46f6a4f52fc661dade26/1272x764/esfiha.jpg',tag:'Assado'},
{id:'misto',unit:'un.',desc:'Pão tostado com presunto e queijo derretido.',img:'https://static-images.ifood.com.br/pratos/5bbd48af-70a2-4bfb-a192-66d1503d772a/202408011835_1O21_i.jpg',tag:'Rápido'},
{id:'combo-noturno',unit:'combo',desc:'Seleção prática para retirada na Padoca Noturna.',img:'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=82',tag:'🌙 Noturna'},
{id:'bolo',unit:'fatia',desc:'Fatia generosa de bolo para acompanhar o café.',img:'https://www.oreporterregional.com.br/images/noticias/48030/5d022d777b22c7aa729233c926f86ea4.jpg',tag:'Doce'},
{id:'sonho',unit:'100 g',desc:'Sonho macio, recheado com creme e finalizado com açúcar.',img:'https://p2.trrsf.com/image/fget/cf/1200/1200/middle/images.terra.com/2024/07/02/958314339-sonho-de-padaria-1.jpg',tag:'Clássico'},
{id:'cookie',unit:'100 g',desc:'Cookie macio por dentro com gotas de chocolate.',img:'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=900&q=82',tag:'Queridinho'},
{id:'muffin',unit:'100 g',desc:'Bolinho individual macio e perfeito para o café.',img:'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&w=900&q=82',tag:'Café'},
{id:'expresso',unit:'copo',desc:'Café curto, aromático e encorpado.',img:'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?auto=format&fit=crop&w=900&q=82',tag:'Quentinho'},
{id:'cappuccino',unit:'copo',desc:'Cappuccino cremoso para acompanhar pães e doces.',img:'https://images.unsplash.com/photo-1497636577773-f1231844b336?auto=format&fit=crop&w=900&q=82',tag:'Cremoso'},
{id:'suco',unit:'copo',desc:'Suco natural gelado e refrescante.',img:'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=900&q=82',tag:'Gelado'},
{id:'agua',unit:'un.',desc:'Água mineral gelada.',img:'https://images.unsplash.com/photo-1550505095-81378a674395?auto=format&fit=crop&w=900&q=82',tag:'Gelado'}
];
const visualById=Object.fromEntries(visual.map(p=>[p.id,p]));
const labels={paes:'Pães',pães:'Pães',salgados:'Salgados',lanches:'Lanches',doces:'Doces',bebidas:'Bebidas'};
const CONFIG_URL='https://yncspxfsvlqdnodlsosb.supabase.co/functions/v1/padoka-public-config';
const safeId=v=>{const s=String(v??'').trim();return /^[a-z0-9][a-z0-9_-]{0,79}$/i.test(s)?s:null};
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
window.PADOKA_CATALOG=[];
window.PADOKA_CATALOG_BY_ID=visualById;
window.PADOKA_CATALOG_READY=false;
window.PADOKA_CATALOG_HAS_DEMO=false;

function refreshConsumers(){
  for(const fn of ['renderCats','renderProducts','renderCart','renderStock','renderProduction','renderLoss','renderReports']){
    try{if(typeof window[fn]==='function')window[fn]()}catch(e){console.error(`PADOKA catalog refresh ${fn}:`,e)}
  }
  window.dispatchEvent(new CustomEvent('padoka:catalog-updated',{detail:{demo:window.PADOKA_CATALOG_HAS_DEMO}}));
}
function markUnavailable(){
  const empty=document.getElementById('empty');
  if(empty){empty.textContent='Cardápio temporariamente indisponível. Tente novamente em instantes.';empty.style.display='block'}
}
function showProvisionalNotice(){
  const section=document.getElementById('cardapio');
  if(!section||document.getElementById('padokaCatalogNotice'))return;
  const cats=document.getElementById('cats');
  const note=document.createElement('div');
  note.id='padokaCatalogNotice';
  note.textContent='Catálogo e valores provisórios até a confirmação dos dados oficiais da padaria.';
  note.style.cssText='margin:7px 0 2px;padding:8px 10px;border:1px solid #e7dbcf;border-radius:12px;background:#fffdf9;color:#776e65;font-size:9px;line-height:1.4';
  (cats||section.querySelector('.search'))?.insertAdjacentElement('afterend',note);
}
function showPublicDataNotice(){
  const info=document.querySelector('#inicio .info');
  if(!info||document.getElementById('padokaPublicDataNotice'))return;
  const note=document.createElement('div');
  note.id='padokaPublicDataNotice';
  note.className='info-card full';
  note.setAttribute('role','note');
  note.innerHTML='<strong>ℹ️ Dados em validação</strong><span>Informações de funcionamento, endereço e campanhas exibidas nesta versão podem ser demonstrativas até a confirmação oficial da padaria.</span>';
  info.appendChild(note);
}
function loadPickupValidation(){
  if(!document.getElementById('pickup')||document.querySelector('script[data-padoka-pickup-validation]'))return;
  const script=document.createElement('script');
  script.src='assets/pickup-validation.js';
  script.defer=true;
  script.dataset.padokaPickupValidation='1';
  document.head.appendChild(script);
}
async function load(){
  try{
    const configResponse=await fetch(CONFIG_URL,{cache:'no-store'});
    if(!configResponse.ok)throw new Error('public config unavailable');
    const cfg=await configResponse.json();
    const endpoint=`${cfg.url}/rest/v1/padoka_products?select=id,name,category,price,is_demo,sort_order&active=eq.true&order=sort_order.asc`;
    const response=await fetch(endpoint,{cache:'no-store',headers:{apikey:cfg.publishableKey}});
    if(!response.ok)throw new Error('catalog unavailable');
    const rows=await response.json();
    const merged=(Array.isArray(rows)?rows:[]).map(row=>{
      const id=safeId(row.id);if(!id)return null;
      const meta=visualById[id]||{};
      const rawCategory=String(row.category||'').trim();
      const label=labels[rawCategory.toLowerCase()]||rawCategory;
      const price=Number(row.price);
      return {id,name:esc(String(row.name||'').trim()),category:esc(label),price,is_demo:!!row.is_demo,sort_order:Number(row.sort_order||0),unit:meta.unit||'un.',desc:meta.desc||'',img:meta.img||'assets/logo-padoka.svg',tag:meta.tag||'PADOKA'};
    }).filter(p=>p&&p.id&&p.name&&Number.isFinite(p.price)&&p.price>=0);
    window.PADOKA_CATALOG.splice(0,window.PADOKA_CATALOG.length,...merged);
    window.PADOKA_CATALOG_HAS_DEMO=merged.some(p=>p.is_demo);
    window.PADOKA_CATALOG_READY=true;
    if(window.PADOKA_CATALOG_HAS_DEMO)showProvisionalNotice();
    refreshConsumers();
  }catch(error){
    console.error('PADOKA catalog:',error);
    window.PADOKA_CATALOG_READY=false;
    markUnavailable();
    refreshConsumers();
  }
}
showPublicDataNotice();
loadPickupValidation();
load();
})();