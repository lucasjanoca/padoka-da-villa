import fs from 'node:fs';

const migration = fs.readFileSync(new URL('../supabase/013_customer_profile_rpc.sql', import.meta.url), 'utf8');
const account = fs.readFileSync(new URL('../conta.html', import.meta.url), 'utf8');
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
ok(/revoke\s+all\s+on\s+function\s+public\.padoka_save_profile[\s\S]*?from\s+public\s*,\s*anon/i.test(migration), 'migration 013: RPC não revoga acesso público/anon');
ok(/grant\s+execute\s+on\s+function\s+public\.padoka_save_profile[\s\S]*?to\s+authenticated/i.test(migration), 'migration 013: RPC não concede execução apenas a authenticated');
ok(/revoke\s+insert\s*,\s*update\s+on\s+table\s+public\.padoka_profiles\s+from\s+authenticated/i.test(migration), 'migration 013: escrita direta no perfil não é revogada após ativação');
ok(!/create\s+trigger[\s\S]{0,500}?\bon\s+auth\.users\b/i.test(migration), 'migration 013: trigger global em auth.users é proibido');

ok(account.includes("rpc('padoka_save_profile'"), 'conta.html: onboarding não tenta RPC padoka_save_profile');
ok(account.includes('profileRpcMissing'), 'conta.html: fallback temporário não está limitado à ausência da RPC');
ok(/PGRST202/.test(account) && /42883/.test(account), 'conta.html: códigos de função ausente não estão tratados');
ok(/p_privacy_accepted:\$\('privacy'\)\.checked/.test(account), 'conta.html: consentimento não é enviado à RPC');
ok(/p_marketing_opt_in:\$\('marketing'\)\.checked/.test(account), 'conta.html: marketing opcional não é enviado à RPC');
ok(!/rpc\('padoka_save_profile'[\s\S]{0,700}?avatar_url/.test(account), 'conta.html: avatar não deve ser confiado como argumento da RPC');
ok(!/rpc\('padoka_save_profile'[\s\S]{0,700}?auth_provider/.test(account), 'conta.html: provider não deve ser confiado como argumento da RPC');

if (failures.length) {
  console.error(`PADOKA profile onboarding audit: ${failures.length} falha(s)`);
  failures.forEach(x => console.error(`- ${x}`));
  process.exit(1);
}

console.log('PADOKA profile onboarding audit: OK');
