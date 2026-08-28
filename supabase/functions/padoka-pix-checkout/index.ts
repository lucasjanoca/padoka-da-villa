import "jsr:@supabase/functions-js@edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.4";

const ALLOWED_ORIGIN = "https://lucasjanoca.github.io";
const corsHeaders = (origin: string | null) => ({
  ...(origin === ALLOWED_ORIGIN ? { "access-control-allow-origin": ALLOWED_ORIGIN } : {}),
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-max-age": "600",
  "vary": "Origin",
});

const json = (status: number, body: Record<string, unknown>, origin: string | null) => new Response(JSON.stringify(body), {
  status,
  headers: {
    ...corsHeaders(origin),
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  },
});

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");

  // Browser calls are accepted only from the current PADOKA host.
  // Server-to-server calls may omit Origin and still require a valid JWT below.
  if (origin && origin !== ALLOWED_ORIGIN) return json(403, { error: "origin_not_allowed" }, origin);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" }, origin);

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("application/json")) return json(415, { error: "unsupported_media_type" }, origin);

  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) return json(401, { error: "authentication_required" }, origin);
  const token = authHeader.slice(7).trim();
  if (!token) return json(401, { error: "authentication_required" }, origin);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return json(503, { error: "server_not_configured" }, origin);

  const admin = createClient(url, serviceKey, {
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
    admin.from("padoka_payment_settings").select("enabled,provider,provider_configured,expiration_seconds,require_provider_confirmation").eq("id", true).maybeSingle(),
  ]);

  // Return the same response for nonexistent and unauthorized orders to avoid leaking order existence.
  if (orderError || !order || order.customer_id !== user.id) return json(404, { error: "order_not_found" }, origin);
  if (settingsError || !settings) return json(503, { error: "payment_settings_unavailable" }, origin);

  // Automatic Pix must never be allowed to bypass provider confirmation, even if settings drift.
  if (settings.require_provider_confirmation !== true) {
    return json(503, { error: "provider_confirmation_required" }, origin);
  }

  // Refuse duplicate/finalized payment flows before any future provider adapter is invoked.
  if (["paid", "paid_late", "refunded"].includes(String(order.payment_status || ""))) {
    return json(409, { error: "payment_already_finalized" }, origin);
  }

  // The amount always comes from the server-authoritative order and must be valid before charge creation.
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

  // Fail closed until the selected bank/provider adapter is implemented.
  // Never trust amount, txid or a "paid" flag supplied by the browser.
  return json(501, { error: "provider_adapter_pending", provider: settings.provider }, origin);
});
