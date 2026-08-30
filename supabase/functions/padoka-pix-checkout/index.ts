import "jsr:@supabase/functions-js@2.112.4/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.4";

const ALLOWED_ORIGINS = new Set([
  "https://lucasjanoca.github.io",
  "https://padoka-da-villa.pages.dev",
]);

const corsHeaders = (origin: string | null) => ({
  ...(origin && ALLOWED_ORIGINS.has(origin) ? { "access-control-allow-origin": origin } : {}),
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-max-age": "600",
  "vary": "Origin",
});

const json = (status: number, body: Record<string, unknown>, origin: string | null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(origin),
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
    },
  });

const readAdminKey = () => {
  try {
    const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
    if (raw) {
      const parsed = JSON.parse(raw);
      const value = parsed?.default;
      if (typeof value === "string" && value.startsWith("sb_secret_")) return value;
    }
  } catch {}
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  return typeof legacy === "string" && legacy.length > 20 ? legacy : null;
};

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");

  // Browser calls are accepted only from explicitly trusted PADOKA hosts.
  // Server-to-server calls may omit Origin and still require a valid JWT below.
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json(403, { error: "origin_not_allowed" }, origin);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" }, origin);

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return json(415, { error: "unsupported_media_type" }, origin);
  }

  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return json(401, { error: "authentication_required" }, origin);
  }
  const token = authHeader.slice(7).trim();
  if (!token) return json(401, { error: "authentication_required" }, origin);

  const url = Deno.env.get("SUPABASE_URL");
  const adminKey = readAdminKey();
  if (!url || !adminKey) return json(503, { error: "server_not_configured" }, origin);

  const admin = createClient(url, adminKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  const user = userData?.user;
  if (userError || !user) return json(401, { error: "invalid_session" }, origin);

  let body: { order_id?: string } = {};
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "invalid_json" }, origin);
  }

  const orderId = String(body.order_id || "").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)) {
    return json(400, { error: "invalid_order_id" }, origin);
  }

  const [{ data: order, error: orderError }, { data: settings, error: settingsError }] = await Promise.all([
    admin.from("padoka_orders").select("id,customer_id,total,payment_status").eq("id", orderId).maybeSingle(),
    admin
      .from("padoka_payment_settings")
      .select("enabled,provider,provider_configured,expiration_seconds,require_provider_confirmation")
      .eq("id", true)
      .maybeSingle(),
  ]);

  // Use the same response for nonexistent and unauthorized orders to avoid enumeration.
  if (orderError || !order || order.customer_id !== user.id) {
    return json(404, { error: "order_not_found" }, origin);
  }
  if (settingsError || !settings) return json(503, { error: "payment_settings_unavailable" }, origin);

  // Automatic Pix must never bypass provider confirmation, even if settings drift.
  if (settings.require_provider_confirmation !== true) {
    return json(503, { error: "provider_confirmation_required" }, origin);
  }

  // Never start a second charge for an order already financially finalized.
  if (["paid", "paid_late", "refunded"].includes(String(order.payment_status || ""))) {
    return json(409, { error: "payment_already_finalized" }, origin);
  }

  // Amount is server-authoritative. The browser never chooses it.
  const orderTotal = Number(order.total);
  if (!Number.isFinite(orderTotal) || orderTotal <= 0) {
    return json(409, { error: "invalid_order_total" }, origin);
  }

  if (!settings.enabled || !settings.provider_configured || settings.provider === "unconfigured") {
    return json(409, {
      error: "payment_provider_not_configured",
      expiration_seconds: settings.expiration_seconds || 300,
    }, origin);
  }

  // Fail closed until the selected bank/provider adapter and signed webhook are implemented.
  return json(501, { error: "provider_adapter_pending", provider: settings.provider }, origin);
});
