import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.112.4";
import { sendPushNotification, WebPushError } from "npm:@mmmike/web-push@1.3.0/send";

const ALLOWED_ORIGINS = new Set([
  "https://lucasjanoca.github.io",
  "https://padoka-da-villa.pages.dev",
]);

const PROJECT_URL = Deno.env.get("SUPABASE_URL") || "";

function readSecretKey(): string | null {
  try {
    const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.default === "string" && parsed.default.length > 20) return parsed.default;
    }
  } catch {}
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  return typeof legacy === "string" && legacy.length > 20 ? legacy : null;
}

const corsHeaders = (origin: string | null) => ({
  ...(origin && ALLOWED_ORIGINS.has(origin) ? { "access-control-allow-origin": origin } : {}),
  "access-control-allow-headers": "authorization, content-type, apikey, x-client-info",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-max-age": "600",
  "cache-control": "no-store",
  "vary": "Origin",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
});

const json = (status: number, body: Record<string, unknown>, origin: string | null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "content-type": "application/json; charset=utf-8" },
  });

const isUuid = (value: unknown) =>
  typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const safeText = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const constantTimeEqual = (a: string, b: string) => {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json(403, { error: "origin_not_allowed" }, origin);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (!PROJECT_URL) return json(503, { error: "service_unavailable" }, origin);

  const secretKey = readSecretKey();
  if (!secretKey) return json(503, { error: "server_key_unavailable" }, origin);

  const admin = createClient(PROJECT_URL, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (req.method === "GET") {
    const url = new URL(req.url);
    if ((url.searchParams.get("action") || "config") !== "config") {
      return json(400, { error: "invalid_action" }, origin);
    }
    const { data, error } = await admin
      .from("padoka_push_config")
      .select("vapid_public_key")
      .eq("id", 1)
      .maybeSingle();
    if (error || !data?.vapid_public_key) return json(503, { error: "push_not_configured" }, origin);
    return json(200, { publicKey: data.vapid_public_key }, origin);
  }

  if (req.method !== "POST") return json(405, { error: "method_not_allowed" }, origin);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "invalid_json" }, origin);
  }

  const action = safeText(body.action, 40);

  if (action === "subscribe" || action === "unsubscribe") {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return json(401, { error: "missing_authorization" }, origin);

    const { data: authData, error: authError } = await admin.auth.getUser(token);
    const user = authData?.user;
    if (authError || !user) return json(401, { error: "invalid_session" }, origin);

    if (action === "unsubscribe") {
      const endpoint = safeText(body.endpoint, 4096);
      if (!endpoint) return json(400, { error: "invalid_endpoint" }, origin);
      const { error } = await admin
        .from("padoka_push_subscriptions")
        .delete()
        .eq("user_id", user.id)
        .eq("endpoint", endpoint);
      if (error) return json(500, { error: "unsubscribe_failed" }, origin);
      return json(200, { ok: true }, origin);
    }

    const subscription = body.subscription as {
      endpoint?: unknown;
      keys?: { p256dh?: unknown; auth?: unknown };
    } | undefined;

    const endpoint = safeText(subscription?.endpoint, 4096);
    const p256dh = safeText(subscription?.keys?.p256dh, 1024);
    const authKey = safeText(subscription?.keys?.auth, 1024);
    if (!endpoint.startsWith("https://") || !p256dh || !authKey) {
      return json(400, { error: "invalid_subscription" }, origin);
    }

    const now = new Date().toISOString();
    const { error } = await admin.from("padoka_push_subscriptions").upsert({
      user_id: user.id,
      endpoint,
      p256dh,
      auth_key: authKey,
      user_agent: safeText(req.headers.get("user-agent"), 512) || null,
      updated_at: now,
      last_seen_at: now,
    }, { onConflict: "endpoint" });

    if (error) return json(500, { error: "subscription_save_failed" }, origin);
    return json(200, { ok: true }, origin);
  }

  if (action !== "notification") return json(400, { error: "invalid_action" }, origin);

  const { data: serverConfig, error: serverConfigError } = await admin.rpc("padoka_get_push_server_config");
  const providedSecret = safeText(req.headers.get("x-padoka-push-secret"), 256);
  const webhookSecret = typeof serverConfig?.webhook_secret === "string" ? serverConfig.webhook_secret : "";
  const vapidPrivateKey = typeof serverConfig?.vapid_private_key === "string" ? serverConfig.vapid_private_key : "";

  if (serverConfigError || !webhookSecret || !vapidPrivateKey) {
    return json(503, { error: "server_push_config_unavailable" }, origin);
  }
  if (!constantTimeEqual(providedSecret, webhookSecret)) {
    return json(401, { error: "invalid_internal_secret" }, origin);
  }

  const notificationId = body.notification_id;
  if (!isUuid(notificationId)) return json(400, { error: "invalid_notification_id" }, origin);

  const { data: notification, error: notificationError } = await admin
    .from("padoka_customer_notifications")
    .select("id,user_id,order_id,title,body,push_dispatched_at")
    .eq("id", notificationId)
    .maybeSingle();

  if (notificationError) return json(500, { error: "notification_lookup_failed" }, origin);
  if (!notification) return json(202, { ok: true, ignored: true }, origin);
  if (notification.push_dispatched_at) return json(200, { ok: true, duplicate: true }, origin);

  const [{ data: config, error: configError }, { data: subscriptions, error: subscriptionsError }] =
    await Promise.all([
      admin.from("padoka_push_config").select("vapid_public_key,vapid_subject").eq("id", 1).maybeSingle(),
      admin.from("padoka_push_subscriptions").select("id,endpoint,p256dh,auth_key").eq("user_id", notification.user_id),
    ]);

  if (configError || !config?.vapid_public_key || !config?.vapid_subject) {
    return json(503, { error: "push_not_configured" }, origin);
  }
  if (subscriptionsError) return json(500, { error: "subscription_lookup_failed" }, origin);

  let clickUrl = "acompanhamento.html";
  if (notification.order_id) {
    const { data: order } = await admin.from("padoka_orders").select("code").eq("id", notification.order_id).maybeSingle();
    if (order?.code) clickUrl += "?code=" + encodeURIComponent(order.code);
  }

  const rows = subscriptions || [];
  if (!rows.length) {
    await admin.from("padoka_customer_notifications")
      .update({ push_dispatched_at: new Date().toISOString() })
      .eq("id", notification.id)
      .is("push_dispatched_at", null);
    return json(200, { ok: true, delivered: 0 }, origin);
  }

  const claimTime = new Date().toISOString();
  const { data: claimed, error: claimError } = await admin
    .from("padoka_customer_notifications")
    .update({ push_dispatched_at: claimTime })
    .eq("id", notification.id)
    .is("push_dispatched_at", null)
    .select("id")
    .maybeSingle();

  if (claimError) return json(500, { error: "dispatch_claim_failed" }, origin);
  if (!claimed) return json(200, { ok: true, duplicate: true }, origin);

  const vapid = {
    publicKey: config.vapid_public_key,
    privateKey: vapidPrivateKey,
    subject: config.vapid_subject,
  };

  let delivered = 0;
  let removed = 0;
  let failed = 0;

  await Promise.all(rows.map(async (row) => {
    try {
      const ok = await sendPushNotification(
        { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth_key } },
        {
          title: notification.title,
          body: notification.body,
          icon: "./assets/logo-padoka.svg",
          tag: notification.order_id ? "padoka-order-" + notification.order_id : "padoka-notification",
          url: clickUrl,
        },
        vapid,
        { ttl: 60 * 60 * 6, urgency: "high" },
      );

      if (ok) {
        delivered += 1;
      } else {
        removed += 1;
        await admin.from("padoka_push_subscriptions").delete().eq("id", row.id);
      }
    } catch (err) {
      if (err instanceof WebPushError && (err.statusCode === 404 || err.statusCode === 410)) {
        removed += 1;
        await admin.from("padoka_push_subscriptions").delete().eq("id", row.id);
      } else {
        failed += 1;
        console.error("padoka push delivery failed", err);
      }
    }
  }));

  return json(200, { ok: true, delivered, removed, failed }, origin);
});
