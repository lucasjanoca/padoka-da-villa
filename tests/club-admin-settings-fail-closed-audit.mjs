import fs from 'node:fs';

const source=fs.readFileSync(new URL('../assets/club-admin.js',import.meta.url),'utf8');
const fail=(message)=>{throw new Error(message)};

if(!source.includes("const PADOKA_ORIGIN='https://yncspxfsvlqdnodlsosb.supabase.co'"))fail('Admin do Club deve continuar fixado no backend correto da PADOKA.');
if(!source.includes('loyaltySettingsLoaded=false'))fail('Admin do Club deve iniciar com configuração de fidelidade indisponível.');
if(!source.includes('setSettingsAvailability(false)'))fail('Admin do Club deve bloquear os controles quando a configuração do servidor não estiver disponível.');
if(!source.includes("if(s.data){fillSettings(s.data);setSettingsAvailability(true)"))fail('Admin do Club só deve habilitar edição depois de receber padoka_loyalty_settings do servidor.');
if(!source.includes("if(!loyaltySettingsLoaded)return notice('settingsNotice'"))fail('Salvamento das regras deve falhar fechado sem configuração carregada do servidor.');
if(/points_per_brl\?\?1|first_order_bonus_points\?\?20|birthday_multiplier\?\?2|redemption_valid_days\?\?30|max_points_per_order\?\?5000/.test(source))fail('Admin do Club não deve inventar regras locais como fallback.');
if(!source.includes("sb.rpc('padoka_admin_update_loyalty_settings'"))fail('Atualização das regras deve continuar server-authoritative via RPC PADOKA.');
if(/service_role|sb_secret_/i.test(source))fail('Frontend administrativo nunca deve conter credencial administrativa.');

console.log('club-admin-settings-fail-closed-audit: ok');
