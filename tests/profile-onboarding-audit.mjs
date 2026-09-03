import fs from 'node:fs';

const migration = fs.readFileSync(new URL('../supabase/013_customer_profile_rpc.sql', import.meta.url), 'utf8');
const accountPage = fs.readFileSync(new URL('../conta.html', import.meta.url), 'utf8');
const account = accountPage+'\n'+fs.readFileSync(new URL('../assets/account.js', import.meta.url), 'utf8');
const failures = [];
const ok = (cond, msg) => { if (!cond) failures.push(msg); };

ok(/create\s+or\s+replace\s+function\s+public\.padoka_save_profile/i.test(migration), 'migration 013: RPC padoka_save_profile ausente');
ok(/security\s+definer/i.test(migration), 'migration 013: RPC deve ser SECURITY DEFINER');
ok(/set\s+search_path\s*=\s*public/i.test(migration), 'migration 013: search_path seguro ausente');
ok(/auth\.uid\(\)\s+is\s+null/i.test(migration), 'migration 013: RPC não exige autenticação');
ok(/p_privacy_accepted/i.test(migration) && /privacy consent required/i.test(migration), 'migration 013: consentimento de privacidade não é exigido no servidor');
ok(/app_scope\s*=\s*'padoka'/i.test(migration), 'migration 013: app_scope não está fixado em padoka');
ok(/auth\.jwt\(\)->'user_metadata'/i.test(migration), 'migration 013: avatar não é derivado da sessão autenticada');
ok(/auth\.jwt\(\)->'app_metadata'/i.test(migration), 'migration 013: provider não é derivado da sessão autenticada');
ok(/v_avatar\s+is\s+not\s+null[\s\S]*?length\(v_avatar\)\s*>\s*500[\s\S]*?v_avatar\s*!~\*\s*'\^https:\/\/'/i.test(migration), 'migration 013: avatar da sessão não é limitado a HTTPS/tamanho no servidor');
ok(/v_provider\s*:=\s*lower\(/i.test(migration), 'migration 013: provider não é normalizado no servidor');
ok(/v_provider\s+not\s+in\s*\(\s*'google'\s*,\s*'email'\s*\)[\s\S]*?v_provider\s*:=\s*'other'/i.test(migration), 'migration 013: provider inesperado não é reduzido a valor seguro');
ok(/revoke\s+all\s+on\s+function\s+public\.padoka_save_profile[\s\S]*?from\s+public\s*,\s*anon/i.test(migration), 'migration 013: RPC não revoga acesso público/anon');
ok(/grant\s+execute\s+on\s+function\s+public\.padoka_save_profile[\s\S]*?to\s+authenticated/i.test(migration), 'migration 013: RPC não concede execução apenas a authenticated');
ok(/revoke\s+insert\s*,\s*update\s+on\s+table\s+public\.padoka_profiles\s+from\s+authenticated/i.test(migration), 'migration 013: escrita direta no perfil não é revogada após ativação');
ok(!/create\s+trigger[\s\S]{0,500}?\bon\s+auth\.users\b/i.test(migration), 'migration 013: trigger global em auth.users é proibido');

// Contrato de minimização de dados no primeiro acesso: endereço/CPF não pertencem ao onboarding padrão.
const rpcSignature = migration.match(/public\.padoka_save_profile\s*\(([\s\S]*?)\)\s*returns/i)?.[1] || '';
ok(/p_full_name\s+text/i.test(rpcSignature), 'migration 013: nome deve permanecer no contrato do onboarding');
ok(/p_phone\s+text/i.test(rpcSignature), 'migration 013: telefone/WhatsApp deve permanecer no contrato do onboarding');
ok(/p_birthday\s+date\s+default\s+null/i.test(rpcSignature), 'migration 013: aniversário deve permanecer opcional');
ok(/p_marketing_opt_in\s+boolean\s+default\s+false/i.test(rpcSignature), 'migration 013: marketing deve permanecer opt-in e opcional');
ok(/p_privacy_accepted\s+boolean\s+default\s+false/i.test(rpcSignature), 'migration 013: consentimento deve permanecer explícito');
ok(!/cpf|document|tax_id|address|street|cep|postal|delivery/i.test(rpcSignature), 'migration 013: CPF/endereço não podem entrar no onboarding padrão');
ok(/length\(v_phone\)\s*<\s*8/i.test(migration), 'migration 013: telefone/WhatsApp deve continuar validado no servidor');
ok(/length\(v_name\)\s*<\s*2/i.test(migration), 'migration 013: nome deve continuar validado no servidor');

ok(account.includes("rpc('padoka_save_profile'"), 'conta.html: onboarding não usa RPC padoka_save_profile');
ok(!account.includes('profileRpcMissing'), 'conta.html: fallback temporário de RPC ausente deve permanecer removido');
ok(!/sb\.from\('padoka_profiles'\)\.update\(/.test(account), 'conta.html: escrita direta UPDATE em padoka_profiles é proibida');
ok(!/sb\.from\('padoka_profiles'\)\.insert\(/.test(account), 'conta.html: escrita direta INSERT em padoka_profiles é proibida');
ok(/p_privacy_accepted:\$\('privacy'\)\.checked/.test(account), 'conta.html: consentimento não é enviado à RPC');
ok(/p_marketing_opt_in:\$\('marketing'\)\.checked/.test(account), 'conta.html: marketing opcional não é enviado à RPC');
const argsMatch = account.match(/const args=\{([^}]*)\};return sb\.rpc\('padoka_save_profile',args\)/);
ok(!!argsMatch, 'conta.html: argumentos da RPC não foram localizados de forma auditável');
if (argsMatch) {
  ok(!/avatar_url/.test(argsMatch[1]), 'conta.html: avatar não deve ser confiado como argumento da RPC');
  ok(!/auth_provider/.test(argsMatch[1]), 'conta.html: provider não deve ser confiado como argumento da RPC');
  ok(!/cpf|document|tax_id|address|street|cep|postal|delivery/i.test(argsMatch[1]), 'conta.html: CPF/endereço não podem ser enviados pelo onboarding padrão');
}

const onboarding = accountPage.match(/<section\s+class="card hidden"\s+id="onboardingView">([\s\S]*?)<\/section>/i)?.[1] || '';
ok(!!onboarding, 'conta.html: seção de primeiro acesso não foi localizada');
ok(/id="name"[^>]*autocomplete="name"/i.test(onboarding), 'conta.html: nome editável deve permanecer no primeiro acesso');
ok(/id="email"[^>]*type="email"[^>]*readonly/i.test(onboarding), 'conta.html: e-mail autenticado deve permanecer pré-preenchido/somente leitura');
ok(/id="phone"[^>]*type="tel"[^>]*autocomplete="tel"/i.test(onboarding), 'conta.html: telefone/WhatsApp deve permanecer no primeiro acesso');
ok(/Aniversário\s*\(opcional\)/i.test(onboarding) && /id="birthday"[^>]*type="date"/i.test(onboarding), 'conta.html: aniversário deve permanecer claramente opcional');
ok(/id="privacy"[^>]*type="checkbox"/i.test(onboarding), 'conta.html: consentimento de privacidade deve permanecer explícito');
ok(/id="marketing"[^>]*type="checkbox"/i.test(onboarding), 'conta.html: marketing opcional deve permanecer separado');
ok(!/id="birthday"[^>]*\brequired\b/i.test(onboarding), 'conta.html: aniversário não pode virar obrigatório');
ok(!/id="marketing"[^>]*\brequired\b/i.test(onboarding), 'conta.html: marketing não pode virar obrigatório');
ok(!/cpf|cnpj|documento|endereço|endereco|logradouro|cep|postal/i.test(onboarding), 'conta.html: CPF/endereço não podem ser exigidos no onboarding padrão');
ok(/function\s+prefill\(\)\{const m=user\?\.user_metadata\|\|\{\};/.test(account), 'conta.html: identidade autenticada não é usada no pré-preenchimento do nome');
ok(/\$\('name'\)\.value=profile\?\.full_name\|\|m\.full_name\|\|m\.name\|\|''/.test(account), 'conta.html: nome deve continuar pré-preenchido e editável');
ok(/\$\('email'\)\.value=user\?\.email\|\|''/.test(account), 'conta.html: e-mail deve continuar pré-preenchido a partir da sessão autenticada');

ok(/external\?\.google/.test(account), 'conta.html: estado do provider Google não é pré-verificado');
ok(/googleEnabled===false/.test(account), 'conta.html: provider Google desativado não é tratado antes do OAuth');
ok(/provider:'google'/.test(account), 'conta.html: OAuth Google ausente');
ok(/prompt:'select_account'/.test(account), 'conta.html: OAuth Google deve solicitar escolha de conta');
ok(/flowType:'pkce'/.test(account), 'conta.html: cliente Auth deve manter fluxo PKCE');
ok(!/client_secret|service_role|sb_secret_/i.test(account), 'conta.html: segredo administrativo não pode aparecer no cliente');

ok(/function\s+esc\(v\)/.test(account), 'conta.html: helper de escape de HTML ausente');
ok(/function\s+safeAvatarUrl\(v\)/.test(account), 'conta.html: validação de URL do avatar ausente');
ok(/u\.protocol==='https:'/.test(account), 'conta.html: avatar deve aceitar somente HTTPS');
ok(/\$\('profileName'\)\.textContent=displayName/.test(account), 'conta.html: nome do perfil deve ser renderizado com textContent');
ok(/\$\('profileContact'\)\.textContent=/.test(account), 'conta.html: contato do perfil deve ser renderizado com textContent');
ok(/\$\{esc\(code\)\}/.test(account), 'conta.html: código do pedido não está escapado antes do HTML');
ok(/\$\{esc\(status\)\}/.test(account), 'conta.html: status do pedido não está escapado antes do HTML');
ok(/\$\{esc\(date\)\}/.test(account) && /\$\{esc\(total\)\}/.test(account), 'conta.html: metadados do pedido não estão escapados');
ok(/src=\\?"\$\{esc\(pic\)\}/.test(account), 'conta.html: URL do avatar não está escapada no atributo src');

if (failures.length) {
  console.error(`PADOKA profile onboarding audit: ${failures.length} falha(s)`);
  failures.forEach(x => console.error(`- ${x}`));
  process.exit(1);
}

console.log('PADOKA profile onboarding audit: OK');
