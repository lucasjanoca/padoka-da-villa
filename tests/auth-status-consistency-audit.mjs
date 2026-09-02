import fs from 'node:fs';

const authStatus = fs.readFileSync('AUTH_STATUS.md', 'utf8');
const orderRuntime = fs.readFileSync('assets/order-idempotency.js', 'utf8');

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

expect(authStatus.includes('Sites De Clientes!'), 'AUTH_STATUS must identify the PADOKA backend project');
expect(authStatus.includes('yncspxfsvlqdnodlsosb'), 'AUTH_STATUS must pin the correct PADOKA project ref');
expect(authStatus.includes('InfoTech.io não é usado pela PADOKA'), 'AUTH_STATUS must keep InfoTech.io explicitly out of PADOKA scope');
expect(authStatus.includes('`padoka_create_order_once_v3`'), 'AUTH_STATUS must document the current checkout order RPC');
expect(authStatus.includes('`padoka_create_order_once`') && authStatus.includes('`padoka_create_order_once_v2`'), 'AUTH_STATUS must identify superseded checkout RPCs as legacy');
expect(orderRuntime.includes("sb.rpc('padoka_create_order_once_v3'"), 'runtime must match the checkout RPC documented in AUTH_STATUS');
expect(!orderRuntime.includes("sb.rpc('padoka_create_order_once',"), 'runtime must not regress to checkout v1');
expect(!orderRuntime.includes("sb.rpc('padoka_create_order_once_v2',"), 'runtime must not regress to checkout v2');
expect(authStatus.includes('prompt=select_account'), 'AUTH_STATUS must preserve Google account selection requirement');
expect(authStatus.includes('Não existe trigger global em `auth.users`'), 'AUTH_STATUS must preserve the no-global-auth-trigger boundary');
expect(authStatus.includes('telefone / WhatsApp é obrigatório'), 'AUTH_STATUS must preserve required onboarding phone/WhatsApp');
expect(authStatus.includes('CPF não é obrigatório por padrão'), 'AUTH_STATUS must preserve optional CPF policy');

console.log('auth status consistency audit passed');
