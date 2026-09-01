import fs from 'node:fs';

const source=fs.readFileSync(new URL('../assets/club.js',import.meta.url),'utf8');
const fail=(message)=>{throw new Error(message)};

if(!source.includes("const EXPECTED_PROJECT_REF='yncspxfsvlqdnodlsosb'"))fail('PADOKA Club deve continuar fixado no project ref correto.');
if(!source.includes("if(!s.data)throw new Error('loyalty settings unavailable');"))fail('PADOKA Club deve falhar fechado quando a configuração de fidelidade não vier do servidor.');
if(/settings\s*=\s*s\.data\s*\|\|\s*\{/.test(source))fail('PADOKA Club não deve inventar configuração padrão de fidelidade no navegador.');
if(source.includes('points_per_brl:1,first_order_bonus_points:20,birthday_multiplier:2'))fail('Benefícios padrão demonstrativos não devem ser usados como fallback de produção.');
if(!source.includes("sb.rpc('padoka_redeem_reward'"))fail('Resgate deve continuar server-authoritative via RPC PADOKA.');
if(!source.includes("sb.rpc('padoka_cancel_loyalty_redemption'"))fail('Cancelamento de resgate deve continuar server-authoritative via RPC PADOKA.');
if(/service_role|sb_secret_/i.test(source))fail('Frontend do PADOKA Club nunca deve conter credencial administrativa.');

console.log('club-settings-fail-closed-audit: ok');
