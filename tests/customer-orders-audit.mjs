import fs from 'node:fs';

const source = fs.readFileSync('acompanhamento.html', 'utf8');

function requirePattern(pattern, message) {
  if (!pattern.test(source)) throw new Error(message);
}

requirePattern(/\.from\('padoka_orders'\)[\s\S]*?\.eq\('customer_id',customerId\)/, 'Seus pedidos deve filtrar explicitamente padoka_orders pelo usuário autenticado.');
requirePattern(/table:'padoka_orders',filter:`customer_id=eq\.\$\{customerId\}`/, 'Realtime de pedidos deve ser filtrado pelo customer_id autenticado.');
requirePattern(/const customerId=session\.user\.id/, 'Acompanhamento deve derivar customerId da sessão autenticada.');

if (/table:'padoka_order_events'/.test(source)) {
  throw new Error('Acompanhamento não deve assinar eventos globais de padoka_order_events; a atualização do pedido já dispara refresh seguro.');
}

if (/<input[^>]+(?:search|pesquisa)/i.test(source)) {
  throw new Error('Seus pedidos deve continuar sem campo de pesquisa.');
}

console.log('Customer orders audit passed.');
