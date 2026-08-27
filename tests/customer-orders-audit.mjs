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
requirePattern(/itemsByOrder=\{\};eventsByOrder=\{\}/, 'Troca de sessão deve limpar itens e eventos do cliente anterior.');
requirePattern(/sessionGeneration/, 'Acompanhamento deve invalidar carregamentos assíncronos pertencentes a uma sessão antiga.');
requirePattern(/currentSession\(customerId,generation\)/, 'Renderização deve confirmar que a resposta ainda pertence à sessão atual.');
requirePattern(/if\(!nextId\)\{\$\('orders'\)\.innerHTML=signedOutView\(\);return\}/, 'Logout deve limpar a lista e mostrar imediatamente a visão de usuário desconectado.');

if (/table:'padoka_order_events'/.test(source)) {
  throw new Error('Acompanhamento não deve assinar eventos globais de padoka_order_events; a atualização do pedido já dispara refresh seguro.');
}

if (/<input[^>]+(?:search|pesquisa)/i.test(source)) {
  throw new Error('Seus pedidos deve continuar sem campo de pesquisa.');
}

console.log('Customer orders audit passed.');
