import fs from 'node:fs';

const checkout = fs.readFileSync(new URL('../pagamento.html', import.meta.url), 'utf8');
const failures = [];
const ok = (cond, msg) => { if (!cond) failures.push(msg); };

ok(/function\s+esc\(v\)/.test(checkout), 'pagamento.html: helper de escape de HTML ausente');
ok(/function\s+safeAvatarUrl\(v\)/.test(checkout), 'pagamento.html: validação de URL do avatar ausente');
ok(/u\.protocol==='https:'/.test(checkout), 'pagamento.html: avatar deve aceitar somente HTTPS');
ok(/\$\{esc\(pickup\.name\|\|'—'\)\}/.test(checkout), 'pagamento.html: nome de retirada não está escapado');
ok(/\$\{esc\(pickup\.date\|\|'—'\)\}/.test(checkout), 'pagamento.html: data de retirada não está escapada');
ok(/\$\{esc\(pickup\.time\|\|'—'\)\}/.test(checkout), 'pagamento.html: horário de retirada não está escapado');
ok(/\$\{esc\(i\.product_name\)\}/.test(checkout), 'pagamento.html: nome de produto não está escapado');
ok(/\$\{esc\(displayName\)\}/.test(checkout), 'pagamento.html: nome do cliente não está escapado');
ok(/\$\{esc\(email\)\}/.test(checkout) && /\$\{esc\(phone\)\}/.test(checkout), 'pagamento.html: contato do cliente não está escapado');
ok(/src=\\?"\$\{esc\(pic\)\}/.test(checkout), 'pagamento.html: avatar seguro não está escapado no atributo src');
ok(!/\$\{profile\.full_name\}/.test(checkout), 'pagamento.html: nome do perfil não deve entrar cru em HTML');
ok(!/\$\{user\.email\}/.test(checkout), 'pagamento.html: e-mail não deve entrar cru em HTML');
ok(!/\$\{profile\.phone\}/.test(checkout), 'pagamento.html: telefone não deve entrar cru em HTML');
ok(!/src="\$\{pic\}"/.test(checkout), 'pagamento.html: avatar não deve entrar cru no atributo src');

// Automatic Pix must stay fail-closed until a real provider adapter + authenticated webhook are deployed.
ok(!/pix-static\.js/.test(checkout), 'pagamento.html: não deve carregar gerador Pix estático');
ok(!/qrcode\.min\.js/.test(checkout), 'pagamento.html: não deve carregar QR estático enquanto Pix automático estiver indisponível');
ok(!/PADOKA_PIX/.test(checkout), 'pagamento.html: não deve depender de chave/payload Pix no navegador');
ok(!/PIX MANUAL/.test(checkout), 'pagamento.html: não deve oferecer confirmação Pix manual');
ok(/PIX AUTOMÁTICO/.test(checkout), 'pagamento.html: estado do pagamento automático não está identificado');
ok(/checkout permanece bloqueado/i.test(checkout), 'pagamento.html: ausência do provedor deve manter checkout fail-closed');

if (failures.length) {
  console.error(`PADOKA checkout rendering audit: ${failures.length} falha(s)`);
  failures.forEach(x => console.error(`- ${x}`));
  process.exit(1);
}

console.log('PADOKA checkout rendering audit: OK');
