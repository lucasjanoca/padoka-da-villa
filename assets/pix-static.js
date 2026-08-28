(()=>{
const PIX_KEY='+5515997696477';
const MERCHANT_NAME='PADOKA DA VILLA';
const MERCHANT_CITY='CERQUILHO';
const ascii=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9 ]/g,' ').replace(/\s+/g,' ').trim().toUpperCase();
const tlv=(id,value)=>{const v=String(value);return id+String(v.length).padStart(2,'0')+v};
function crc16(text){let crc=0xFFFF;for(let i=0;i<text.length;i++){crc^=text.charCodeAt(i)<<8;for(let j=0;j<8;j++)crc=(crc&0x8000)?((crc<<1)^0x1021)&0xFFFF:(crc<<1)&0xFFFF}return crc.toString(16).toUpperCase().padStart(4,'0')}
function buildPayload(amount,txid='***'){
  const value=Number(amount);
  if(!Number.isFinite(value)||value<=0)throw new Error('invalid pix amount');
  const safeTxid=txid==='***'?'***':ascii(txid).replace(/ /g,'').slice(0,25);
  const merchant=tlv('00','br.gov.bcb.pix')+tlv('01',PIX_KEY);
  let payload=tlv('00','01')+tlv('26',merchant)+tlv('52','0000')+tlv('53','986')+tlv('54',value.toFixed(2))+tlv('58','BR')+tlv('59',ascii(MERCHANT_NAME).slice(0,25))+tlv('60',ascii(MERCHANT_CITY).slice(0,15))+tlv('62',tlv('05',safeTxid||'***'))+'6304';
  return payload+crc16(payload);
}
function render(target,amount,size=220){
  const el=typeof target==='string'?document.getElementById(target):target;
  if(!el||typeof QRCode==='undefined')return null;
  el.replaceChildren();
  const payload=buildPayload(amount);
  new QRCode(el,{text:payload,width:size,height:size,correctLevel:QRCode.CorrectLevel.M});
  return payload;
}
async function copy(text){
  const value=String(text??'');
  try{await navigator.clipboard.writeText(value);return true}catch{}
  try{const ta=document.createElement('textarea');ta.value=value;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();const ok=document.execCommand('copy');ta.remove();return ok}catch{return false}
}
window.PADOKA_PIX=Object.freeze({key:PIX_KEY,buildPayload,render,copy});
})();
