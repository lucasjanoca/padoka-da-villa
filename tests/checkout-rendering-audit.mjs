import fs from 'node:fs';

const html = fs.readFileSync(new URL('../pagamento.html', import.meta.url), 'utf8');
const checkout = fs.readFileSync(new URL('../assets/checkout-page.js', import.meta.url), 'utf8');
const failures = [];
const ok = (cond, msg) => { if (!cond) failures.push(msg); };

ok(html.includes('assets/checkout-page.js'), 'pagamento.html: controlador externo do checkout ausente');
ok(/const\s+esc=v=>/.test(checkout), 'checkout-page.js: helper de escape de HTML ausente');
ok(/\$\{esc\(pickup\.name\|\|'—'\)\}/.test(checkout), 'checkout-page.js: nome de retirada não está escapado');
ok(/\$\{esc\(pickup\.date\|\|'—'\)\}/.test(checkout), 'checkout-page.js: data de retirada não está escapada');
ok(/\$\{esc\(pickup\.time\|\|'—'\)\}/.test(checkout), 'checkout-page.js: horário de retirada não está escapado');
ok(/\$\{esc\(i\.product_name\)\}/.test(checkout), 'checkout-page.js: nome de produto não está escapado');
ok(/\$\{esc\(name\)\}/.test(checkout), 'checkout-page.js: nome do cliente não está escapado');
ok(/\$\{esc\(user\.email\|\|'\'\)\}/.test(checkout), 'checkout-page.js: e-mail do cliente não está escapado');
ok(!/\$\{profile\.full_name\}/.test(checkout), 'checkout-page.js: nome do perfil não deve entrar cru em HTML');
ok(!/\$\{user\.email\}/.test(checkout), 'checkout-page.js: e-mail não deve entrar cru em HTML');
ok(!/\$\{profile\.phone\}/.test(checkout), 'checkout-page.js: telefone não deve entrar cru em HTML');

// Checkout must stay server-backed and fail closed when runtime/config/backend validation fails.
ok(checkout.includes("const PADOKA_ORIGIN='https://yncspxfsvlqdnodlsosb.supabase.co'"), 'checkout-page.js: backend PADOKA não está fixado');
ok(checkout.includes("typeof window.PADOKA_RUNTIME?.getPublicConfig"), 'checkout-page.js: runtime PADOKA obrigatório ausente');
ok(checkout.includes("new URL(String(sb?.supabaseUrl||'')).origin!==PADOKA_ORIGIN"), 'checkout-page.js: validação da origem Supabase ausente');
ok(checkout.includes("$('sendOrder').disabled=true"), 'checkout-page.js: falhas devem manter envio bloqueado');

// Automatic Pix must stay unavailable until a real provider adapter + authenticated webhook are deployed.
ok(!/pix-static\.js/.test(html+checkout), 'checkout: não deve carregar gerador Pix estático');
ok(!/qrcode\.min\.js/.test(html+checkout), 'checkout: não deve carregar QR estático enquanto Pix automático estiver indisponível');
ok(!/PADOKA_PIX/.test(html+checkout), 'checkout: não deve depender de chave/payload Pix no navegador');
ok(!/PIX MANUAL/i.test(html+checkout), 'checkout: não deve oferecer confirmação Pix manual');
ok(/Pix automático/.test(checkout), 'checkout-page.js: estado do Pix automático não está identificado');
ok(/disabled[^>]*aria-disabled="true"|aria-disabled="true"[^>]*disabled/.test(checkout), 'checkout-page.js: Pix automático deve permanecer desabilitado');
ok(/Pagar na retirada/.test(checkout), 'checkout-page.js: pagamento na retirada deve permanecer disponível');

if (failures.length) {
  console.error(`PADOKA checkout rendering audit: ${failures.length} falha(s)`);
  failures.forEach(x => console.error(`- ${x}`));
  process.exit(1);
}

console.log('PADOKA checkout rendering audit: OK');
