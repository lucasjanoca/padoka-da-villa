import fs from 'node:fs';

const edge = fs.readFileSync('supabase/functions/padoka-pix-checkout/index.ts', 'utf8');
const fail = message => { console.error('FAIL:', message); process.exitCode = 1; };
const need = (text, re, message) => { if (!re.test(text)) fail(message); };
const forbid = (text, re, message) => { if (re.test(text)) fail(message); };

need(edge, /createClient\s*}\s*from\s*["']npm:@supabase\/supabase-js@\d+\.\d+\.\d+["']/i, 'supabase-js da Edge Function precisa permanecer fixado em versão explícita');
need(edge, /const\s+ALLOWED_ORIGINS\s*=\s*new Set/i, 'CORS precisa usar allowlist explícita de hosts PADOKA');
need(edge, /https:\/\/lucasjanoca\.github\.io/i, 'host GitHub Pages da PADOKA precisa permanecer permitido');
need(edge, /https:\/\/padoka-da-villa\.pages\.dev/i, 'host Cloudflare Pages de produção precisa permanecer permitido');
forbid(edge, /security-preview\.padoka-da-villa\.pages\.dev/i, 'preview temporário não deve permanecer na allowlist de produção');
forbid(edge, /access-control-allow-origin["']?\s*:\s*["']\*["']/i, 'Edge Function sensível não pode usar CORS wildcard');
need(edge, /if\s*\(origin\s*&&\s*!ALLOWED_ORIGINS\.has\(origin\)\)\s*return\s+json\(403/i, 'origens de navegador fora da PADOKA precisam ser rejeitadas');
need(edge, /if\s*\(req\.method\s*===\s*["']OPTIONS["']\)/i, 'preflight CORS precisa ser tratado explicitamente');
need(edge, /if\s*\(req\.method\s*!==\s*["']POST["']\)\s*return\s+json\(405/i, 'checkout Pix deve aceitar somente POST');
need(edge, /content-type["']?\)\s*\|\|\s*["']["']/i, 'Content-Type precisa ser validado');
need(edge, /startsWith\(["']application\/json["']\)/i, 'checkout Pix deve exigir application/json');
need(edge, /authorization["']?\)\s*\|\|\s*["']["']/i, 'Authorization precisa ser lido explicitamente');
need(edge, /startsWith\(["']bearer ["']\)/i, 'checkout Pix deve exigir Bearer token');
need(edge, /admin\.auth\.getUser\(token\)/i, 'JWT precisa ser validado no Auth antes de usar privilégio administrativo');
need(edge, /SUPABASE_SECRET_KEYS/i, 'Edge Function deve preferir secret keys modernas do Supabase');
need(edge, /SUPABASE_SERVICE_ROLE_KEY/i, 'fallback legado de service role deve permanecer somente no runtime da Edge Function');
forbid(edge, /console\.log\([^\n]*(adminKey|serviceKey|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEYS|token)/i, 'segredos/tokens não podem ser enviados para logs');
need(edge, /order\.customer_id\s*!==\s*user\.id/i, 'pedido precisa pertencer ao usuário autenticado');
need(edge, /return\s+json\(404,\s*\{\s*error:\s*["']order_not_found["']/i, 'pedido inexistente e não autorizado devem responder de forma não enumerável');
need(edge, /require_provider_confirmation/i, 'checkout Pix deve conferir a exigência de confirmação pelo provedor');
need(edge, /settings\.require_provider_confirmation\s*!==\s*true/i, 'drift que desative confirmação do provedor deve falhar fechado');
need(edge, /\[["']paid["'],\s*["']paid_late["'],\s*["']refunded["']\]\.includes/i, 'pedidos com pagamento finalizado não podem abrir nova cobrança');
need(edge, /payment_already_finalized/i, 'checkout Pix deve responder de forma explícita para pagamento já finalizado');
need(edge, /Number\.isFinite\(orderTotal\).*orderTotal\s*<=\s*0/is, 'total server-authoritative precisa ser validado antes da cobrança');
need(edge, /invalid_order_total/i, 'total inválido deve bloquear a criação da cobrança');
need(edge, /provider_configured/i, 'provider precisa estar marcado como configurado no servidor');
need(edge, /settings\.provider\s*===\s*["']unconfigured["']/i, 'provider não configurado precisa falhar fechado');
need(edge, /return\s+json\(501,\s*\{\s*error:\s*["']provider_adapter_pending["']/i, 'sem adapter real, a função precisa continuar falhando fechado');
forbid(edge, /body\.(amount|total|paid|payment_status|txid)/i, 'valor/status/txid enviados pelo navegador não podem ser autoridade do pagamento');
forbid(edge, /from\(["'](?!padoka_)/i, 'Edge Function PADOKA não deve consultar objetos não-padoka_');

if (!process.exitCode) console.log('PIX Edge security audit: OK');
