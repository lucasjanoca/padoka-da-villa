(()=>{
const dateInput=document.getElementById('date');
const timeInput=document.getElementById('time');
const continueBtn=document.getElementById('continue');
if(!dateInput||!timeInput||!continueBtn)return;

const tz='America/Sao_Paulo';
const parts=()=>Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
const now=()=>{const p=parts();return {date:`${p.year}-${p.month}-${p.day}`,time:`${p.hour}:${p.minute}`}};
const notify=t=>{try{if(typeof window.toast==='function')return window.toast(t)}catch{};const hint=document.getElementById('hint');if(hint)hint.textContent=t};

function validate(showMessage=false){
  const current=now();
  dateInput.min=current.date;
  const date=dateInput.value;
  const time=timeInput.value;
  let message='';
  if(date&&date<current.date)message='Escolha uma data de retirada a partir de hoje.';
  else if(date===current.date&&time&&time<current.time)message='Escolha um horário de retirada que ainda não passou.';
  dateInput.setCustomValidity(message&&date<current.date?message:'');
  timeInput.setCustomValidity(message&&date===current.date?message:'');
  if(showMessage&&message)notify(message);
  return !message;
}

function refresh(){
  const previousDate=dateInput.value;
  validate(false);
  if(previousDate&&previousDate<dateInput.min){dateInput.value='';timeInput.value=''}
}

dateInput.addEventListener('change',()=>validate(true));
timeInput.addEventListener('change',()=>validate(true));
continueBtn.addEventListener('click',event=>{
  if(validate(true))return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if(!dateInput.checkValidity())dateInput.focus();else timeInput.focus();
},true);

document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
window.addEventListener('focus',refresh);
refresh();
})();