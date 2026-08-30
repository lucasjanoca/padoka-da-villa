import { chromium } from 'playwright';

const base=(process.env.BASE_URL||'https://lucasjanoca.github.io/padoka-da-villa').replace(/\/$/,'');
const fail=(msg)=>{throw new Error(msg)};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function waitForProduction(){
  for(let i=0;i<18;i++){
    try{
      const [vendor,scanner,sw]=await Promise.all([
        fetch(base+'/vendor/supabase-js-2.112.4.js',{cache:'no-store'}),
        fetch(base+'/vendor/html5-qrcode-2.3.8.js',{cache:'no-store'}),
        fetch(base+'/service-worker.js',{cache:'no-store'})
      ]);
      const swText=sw.ok?await sw.text():'';
      if(vendor.ok&&scanner.ok&&sw.ok&&swText.includes('padoka-pwa-v6')) return;
    }catch{}
    await sleep(10000);
  }
  fail('Produção não convergiu para vendor local + PWA v6');
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
