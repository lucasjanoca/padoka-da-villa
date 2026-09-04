import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

const functions = {
  pix: read("supabase/functions/padoka-pix-checkout/index.ts"),
  publicConfig: read("supabase/functions/padoka-public-config/index.ts"),
  push: read("supabase/functions/padoka-push/index.ts"),
  telemetry: read("supabase/functions/padoka-telemetry/index.ts"),
};

const trustedOrigins = [
  "https://lucasjanoca.github.io",
  "https://padoka-da-villa.pages.dev",
];

for (const [name, source] of Object.entries(functions)) {
  assert.ok(source.includes("ALLOWED_ORIGINS"), `${name}: CORS allowlist ausente`);
  assert.ok(!/access-control-allow-origin[^\n]*["'`]\*["'`]/i.test(source), `${name}: CORS wildcard proibido`);
  for (const origin of trustedOrigins) {
    assert.ok(source.includes(origin), `${name}: host PADOKA confiável ausente: ${origin}`);
  }

  assert.ok(!/[@:]latest\b/i.test(source), `${name}: dependência sem versão fixa`);
  for (const specifier of source.matchAll(/(?:jsr:|npm:)([^"'\s]+)/g)) {
    assert.match(specifier[1], /@\d+\.\d+\.\d+(?:\/|$)/, `${name}: dependência deve estar pinada: ${specifier[1]}`);
  }

  assert.ok(!/sb_secret_[A-Za-z0-9_-]{8,}/.test(source), `${name}: segredo sb_secret_ literal no código`);
  assert.ok(!/service_role\s*[:=]\s*["'`][A-Za-z0-9._-]{12,}/i.test(source), `${name}: service_role literal no código`);
  assert.ok(!/\.from\(["'`](?!padoka_)/.test(source), `${name}: acesso a tabela fora do prefixo padoka_`);
}

assert.ok(functions.pix.includes('req.headers.get("authorization")'), "pix: Authorization obrigatório deve permanecer");
assert.ok(functions.pix.includes("admin.auth.getUser(token)"), "pix: JWT deve ser validado no Auth");
assert.ok(functions.pix.includes("order.customer_id !== user.id"), "pix: pedido deve continuar vinculado ao cliente autenticado");
assert.ok(functions.pix.includes("require_provider_confirmation !== true"), "pix: confirmação do provedor deve falhar fechada");
assert.ok(functions.pix.includes("provider_adapter_pending"), "pix: adapter real ainda deve permanecer fail-closed");

assert.ok(functions.publicConfig.includes('const PADOKA_PROJECT_URL = "https://yncspxfsvlqdnodlsosb.supabase.co"'), "public-config: project ref PADOKA deve permanecer fixo");
assert.ok(functions.publicConfig.includes("SUPABASE_PUBLISHABLE_KEYS"), "public-config: deve preferir publishable key");
assert.ok(!functions.publicConfig.includes("SUPABASE_SERVICE_ROLE_KEY"), "public-config: não pode ler service role");
assert.ok(!functions.publicConfig.includes("SUPABASE_SECRET_KEYS"), "public-config: não pode ler secret key");
assert.ok(functions.publicConfig.includes('scope: "padoka"'), "public-config: escopo PADOKA deve permanecer explícito");

assert.ok(functions.push.includes("admin.auth.getUser(token)"), "push: subscribe/unsubscribe devem validar JWT");
assert.ok(functions.push.includes('.eq("user_id", user.id)'), "push: assinaturas devem permanecer filtradas pelo usuário autenticado");
assert.ok(functions.push.includes("constantTimeEqual(providedSecret, webhookSecret)"), "push: webhook interno deve usar comparação constante");
assert.ok(functions.push.includes("padoka_get_push_server_config"), "push: configuração secreta deve continuar server-side");

assert.ok(functions.telemetry.includes("if (!origin || !ALLOWED_ORIGINS.has(origin))"), "telemetry: chamadas sem Origin devem continuar bloqueadas");
assert.ok(functions.telemetry.includes('s.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}/gi, "[email]")'), "telemetry: redaction de e-mail deve permanecer");
assert.ok(functions.telemetry.includes('"[phone]"'), "telemetry: redaction de telefone deve permanecer");
assert.ok(functions.telemetry.includes("if ((count || 0) >= 90)"), "telemetry: rate limit deve permanecer");

console.log("edge-function-security-audit: ok");
