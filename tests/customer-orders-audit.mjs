import fs from 'node:fs';

const source = fs.readFileSync('acompanhamento.html', 'utf8');

function requirePattern(pattern, message) {
  if (!pattern.test(source)) throw new Error(message);
}

requirePattern(/\.from\('padoka_orders'\)[\s\S]*?\.eq\('customer_id',customerId\)/, 'Seus pedidos deve filtrar explicitamente padoka_orders pelo usuário autenticado.');
requirePattern(/table:'padoka_orders',filter:`customer_id=eq\.\$\{nextId\}`/, 'Realtime de pedidos deve ser filtrado pelo customer_id autenticado.');
requirePattern(/const nextId=session\?\.user\?\.id\|\|null/, 'Lifecycle deve derivar o cliente exclusivamente da sessão autenticada.');
requirePattern(/sb\.auth\.onAuthStateChange\(/, 'Seus pedidos deve reagir a logout e troca de conta via onAuthStateChange.');
requirePattern(/await sb\.removeChannel\(old\)/, 'Acompanhamento deve remover o canal Realtime da sessão anterior.');
requirePattern(/function beginSessionTransition\(nextId\)\{const generation=\+\+sessionGeneration;activeCustomerId=nextId;itemsByOrder=\{\};eventsByOrder=\{\};\$\('orders'\)\.innerHTML=nextId\?loadingCustomerView\(\):signedOutView\(\);return generation\}/, 'Troca de sessão deve invalidar e esconder imediatamente pedidos, itens, eventos e Pix da identidade anterior.');
requirePattern(/const generation=beginSessionTransition\(nextId\);setTimeout\(\(\)=>applySession\(nextSession,\{force:true,generation\}\),0\)/, 'onAuthStateChange deve limpar a visão antiga antes de aguardar a revalidação assíncrona.');
requirePattern(/sessionGeneration/, 'Acompanhamento deve invalidar carregamentos assíncronos pertencentes a uma sessão antiga.');
requirePattern(/currentSession\(customerId,generation\)/, 'Renderização deve confirmar que a resposta ainda pertence à sessão atual.');
requirePattern(/if\(!nextId\)return;await loadCustomer\(nextId,activeGeneration\)/, 'Logout deve permanecer fail-closed após a remoção do canal, sem tentar carregar pedidos.');

if (/table:'padoka_order_events'/.test(source)) {
  throw new Error('Acompanhamento não deve assinar eventos globais de padoka_order_events; a atualização do pedido já dispara refresh seguro.');
}

if (/<input[^>]+(?:search|pesquisa)/i.test(source)) {
  throw new Error('Seus pedidos deve continuar sem campo de pesquisa.');
}

console.log('Customer orders audit passed.');
