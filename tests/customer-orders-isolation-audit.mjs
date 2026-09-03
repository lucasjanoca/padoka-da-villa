import fs from 'node:fs';

const source = fs.readFileSync(new URL('../acompanhamento.html', import.meta.url), 'utf8');
const failures = [];
const ok = (condition, message) => { if (!condition) failures.push(message); };

// The customer surface must stay automatic/mobile-first, without a public order-search box.
ok(/<title>Seus pedidos\s*•\s*PADOKA DA VILLA<\/title>/i.test(source), 'acompanhamento: título Seus pedidos ausente');
ok(!/placeholder=["'][^"']*(?:pesquis|buscar)[^"']*["']/i.test(source), 'acompanhamento: campo de pesquisa reapareceu');
ok(source.includes("const states=['received','seen','confirmed','preparing','ready','completed']"), 'acompanhamento: sequência de progresso foi alterada');
ok(source.includes("ready:'Pode vir buscar!'"), 'acompanhamento: destaque Pode vir buscar! ausente');
ok(source.includes('<details class="order-details">'), 'acompanhamento: detalhes expansíveis ausentes');

// Initial load must be scoped to the authenticated customer before ordering/rendering.
ok(source.includes("sb.from('padoka_orders').select("), 'acompanhamento: pedidos não são carregados do backend');
ok(source.includes(".eq('customer_id',customerId).order('created_at',{ascending:false}).limit(50)"), 'acompanhamento: consulta não está limitada ao customer_id e aos mais recentes');
ok(!/from\(['"]padoka_orders['"]\)[\s\S]{0,500}\.eq\(['"]code['"]/.test(source), 'acompanhamento: busca remota por código pode contornar o escopo do cliente');

// Realtime must subscribe only to rows belonging to the active authenticated customer.
ok(source.includes("table:'padoka_orders',filter:`customer_id=eq.${nextId}`"), 'acompanhamento: canal Realtime não está filtrado pelo cliente ativo');
ok(source.includes('activeCustomerId===customerId&&sessionGeneration===generation'), 'acompanhamento: respostas assíncronas não validam identidade + geração');

// Account changes must fail closed before any asynchronous cleanup/reload finishes.
ok(source.includes('const generation=++sessionGeneration;activeCustomerId=nextId;itemsByOrder={};eventsByOrder={}'), 'acompanhamento: troca de conta não limpa dados da identidade anterior imediatamente');
ok(source.includes("$('orders').innerHTML=nextId?loadingCustomerView():signedOutView()"), 'acompanhamento: troca de conta não entra em estado visual fail-closed');
ok(source.includes('await removeProgressChannel()'), 'acompanhamento: canal Realtime anterior não é removido na troca de sessão');

// Browser code must never carry administrative credentials.
ok(!/service_role|sb_secret_/i.test(source), 'acompanhamento: segredo administrativo detectado no cliente');
ok(!/auth\.users/i.test(source), 'acompanhamento: referência global a auth.users detectada');

if (failures.length) {
  console.error(`PADOKA customer orders isolation audit: ${failures.length} falha(s)`);
  failures.forEach(message => console.error(`- ${message}`));
  process.exit(1);
}

console.log('PADOKA customer orders isolation audit: OK');
