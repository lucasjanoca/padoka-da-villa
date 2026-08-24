import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const json = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) return json(401, { error: "authentication_required" });
  const token = authHeader.slice(7).trim();

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return json(503, { error: "server_not_configured" });

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  const user = userData?.user;
  if (userError || !user) return json(401, { error: "invalid_session" });

  let body: { order_id?: string } = {};
  try { body = await req.json(); } catch { return json(400, { error: "invalid_json" }); }
  const orderId = String(body.order_id || "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return json(400, { error: "invalid_order_id" });

  const [{ data: order, error: orderError }, { data: settings, error: settingsError }] = await Promise.all([
    admin.from("padoka_orders").select("id,customer_id,total,payment_status").eq("id", orderId).maybeSingle(),
    admin.from("padoka_payment_settings").select("enabled,provider,provider_configured,expiration_seconds").eq("id", true).maybeSingle()
  ]);

  if (orderError || !order || order.customer_id !== user.id) return json(404, { error: "order_not_found" });
  if (settingsError || !settings) return json(503, { error: "payment_settings_unavailable" });
  if (!settings.enabled || !settings.provider_configured || settings.provider === "unconfigured") {
    return json(409, { error: "payment_provider_not_configured", expiration_seconds: settings.expiration_seconds || 180 });
  }

  // Fail closed until the selected bank/provider adapter is implemented.
  // Never trust amount, txid or a "paid" flag supplied by the browser.
  return json(501, { error: "provider_adapter_pending", provider: settings.provider });
});
