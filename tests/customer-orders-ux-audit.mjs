import fs from 'node:fs';

const page = fs.readFileSync('acompanhamento.html', 'utf8');
const PADOKA_ORIGIN = 'https://yncspxfsvlqdnodlsosb.supabase.co';

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

expect(page.includes('<title>Seus pedidos • PADOKA DA VILLA</title>'), 'customer orders page must remain identified as Seus pedidos');
expect(page.includes('<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'), 'customer orders page must remain mobile-first');
expect(!/<input[^>]+(?:type=["']?search|placeholder=["'][^"']*pesquis)/i.test(page), 'customer orders page must not add a manual search field');
expect(page.includes("const states=['received','seen','confirmed','preparing','ready','completed']"), 'customer order progress must preserve the full lifecycle');
expect(page.includes("ready:'Pode vir buscar!'"), 'ready orders must keep the Pode vir buscar! highlight');
expect(page.includes('<details class="order-details">'), 'customer orders must preserve expandable details');
expect(page.includes(".from('padoka_orders')"), 'customer orders must load from padoka_orders');
expect(page.includes(".eq('customer_id',customerId)"), 'customer order reads must stay scoped to the authenticated customer');
expect(page.includes(".order('created_at',{ascending:false})"), 'customer orders must remain newest first');
expect(page.includes("filter:`customer_id=eq.${nextId}`"), 'Realtime updates must remain scoped to the authenticated customer');
expect(page.includes("onAuthStateChange"), 'customer orders must react to authentication lifecycle changes');
expect(page.includes("beginSessionTransition(nextId)"), 'account changes must immediately enter a fail-closed transition state');
expect(page.includes(`const CONFIG_URL='${PADOKA_ORIGIN}/functions/v1/padoka-public-config'`), 'customer orders config must remain pinned to the PADOKA project');
expect(page.includes(`connect-src 'self' ${PADOKA_ORIGIN} wss://yncspxfsvlqdnodlsosb.supabase.co`), 'customer orders CSP must restrict backend connections to PADOKA HTTP/WSS origins');
expect(!/https:\/\/\*\.supabase\.co|wss:\/\/\*\.supabase\.co/i.test(page), 'customer orders CSP must not allow wildcard Supabase origins');
expect(!/service_role|sb_secret_/i.test(page), 'customer orders page must never expose privileged Supabase credentials');
expect(!/href=["'][^"']*(?:internal|pedidos|pdv|gestao)\.html/i.test(page), 'customer orders page must not expose internal operation links');

console.log('customer orders UX and isolation audit passed');
