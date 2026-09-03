import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base=(process.env.BASE_URL||'https://lucasjanoca.github.io/padoka-da-villa').replace(/\/$/,'');
const fail=(msg)=>{throw new Error(msg)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const sourceServiceWorker=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
const expectedCache=sourceServiceWorker.match(/CACHE_NAME\s*=\s*['"]([^'"]+)['"]/)?.[1];
if(!expectedCache||!/^padoka-pwa-v\d+$/.test(expectedCache)) fail('CACHE_NAME local do Service Worker é inválido');

async function waitForProduction(){
  for(let i=0;i<18;i++){
    try{
      const [vendor,scanner,sw]=await Promise.all([
        fetch(base+'/vendor/supabase-js-2.112.4.js',{cache:'no-store'}),
        fetch(base+'/vendor/html5-qrcode-2.3.8.js',{cache:'no-store'}),
        fetch(base+'/service-worker.js',{cache:'no-store'})
      ]);
      const swText=sw.ok?await sw.text():'';
      if(vendor.ok&&scanner.ok&&sw.ok&&swText.includes(`CACHE_NAME = '${expectedCache}'`)) return;
    }catch{}
    await sleep(10000);
  }
  fail('Produção não convergiu para vendor local + cache '+expectedCache);
}

await waitForProduction();

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const page=await context.newPage();
const securityConsole=[];
const failedAssets=[];
page.on('console',msg=>{
  const text=msg.text();
  if(msg.type()==='error' && /content security policy|refused to|blocked by/i.test(text)) securityConsole.push(text);
});
page.on('response',response=>{
  const u=response.url();
  if(u.startsWith(base) && response.status()>=400) failedAssets.push(response.status()+' '+u);
});

await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForFunction(()=>window.PADOKA_CATALOG_READY===true,{timeout:30000});
await page.locator('[data-add]').first().waitFor({state:'visible',timeout:15000});
const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
if(overflow>2) fail('Layout mobile possui overflow horizontal de '+overflow+'px');
const productImages=page.locator('#grid .photo img');
for(let i=0;i<await productImages.count();i++){
  const img=productImages.nth(i);
  await img.scrollIntoViewIfNeeded();
  await img.evaluate(el=>el.complete||new Promise(resolve=>{el.addEventListener('load',resolve,{once:true});el.addEventListener('error',resolve,{once:true})}));
  if(await img.getAttribute('data-padoka-fallback-applied')==='1') fail('Imagem de produto caiu no fallback: '+(await img.getAttribute('alt')));
}

const csp=await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
if(!csp||/script-src[^;]*https?:\/\//i.test(csp)||/script-src[^;]*'unsafe-inline'/i.test(csp)) fail('CSP de script regressou');
if(!csp.includes("style-src-attr 'none'")) fail('Home perdeu bloqueio de style attributes');

const firstProduct=page.locator('[data-product-link]').first();
const href=await firstProduct.getAttribute('href');
if(!href) fail('Link de produto ausente');

await page.locator('[data-add]').first().click();
if((await page.locator('#cartCount').textContent())!=='1') fail('Carrinho não incrementou');
await page.locator('#openCart').click();
await page.locator('#checkout').click();
await page.locator('#name').fill('Teste E2E');
const tomorrow=new Date(Date.now()+86400000).toISOString().slice(0,10);
await page.locator('#date').fill(tomorrow);
await page.locator('#time').fill('10:00');
await page.locator('#continue').click();
await page.waitForURL(/(?:pagamento|conta)\.html/,{timeout:15000});

await page.goto(new URL(href,base+'/').href,{waitUntil:'domcontentloaded',timeout:30000});
await page.locator('#productView').waitFor({state:'visible',timeout:30000});
if(!(await page.locator('#productName').textContent())?.trim()) fail('Produto sem nome');

const manifest=await (await context.request.get(base+'/manifest.webmanifest')).json();
if(!manifest.icons?.some(i=>i.src==='assets/icon-192.png')) fail('Manifest sem ícone 192');
if(!manifest.icons?.some(i=>i.src==='assets/icon-512.png')) fail('Manifest sem ícone 512');

for(const privatePath of ['/supabase/','/tests/','/SECURITY.md','/.github/']){
  const r=await context.request.get(base+privatePath);
  if(r.status()!==404) fail('Artefato técnico ficou público: '+privatePath+' HTTP '+r.status());
}

for(const path of [
  '/vendor/supabase-js-2.112.4.js',
  '/vendor/html5-qrcode-2.3.8.js',
  '/assets/frame-guard.js',
  '/assets/runtime-security.css',
  '/assets/icon-192.png',
  '/assets/icon-512.png'
]){
  const r=await context.request.get(base+path);
  if(r.status()!==200) fail(path+' retornou '+r.status());
}

if(securityConsole.length) fail('Erros CSP no navegador: '+securityConsole.join(' | '));
const important404=failedAssets.filter(x=>/vendor\/|frame-guard|runtime-security|service-worker|manifest/.test(x));
if(important404.length) fail('Assets críticos falharam: '+important404.join(' | '));

await browser.close();
console.log('PADOKA browser E2E: OK');
