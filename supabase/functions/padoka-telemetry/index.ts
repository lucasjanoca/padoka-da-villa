import { createClient } from "npm:@supabase/supabase-js@2.112.4";

const ALLOWED_ORIGINS = new Set([
  "https://lucasjanoca.github.io",
  "https://padoka-da-villa.pages.dev",
]);

const EVENTS = new Set([
  "page_view","product_view","add_to_cart","remove_from_cart",
  "checkout_start","checkout_review","checkout_submit","checkout_success",
  "auth_login","order_view","client_error","web_vital",
  "feature_exposure","reorder",
]);

const META_KEYS = new Set([
  "metric","rating","element","error_name","error_message",
  "connection","device","version","product_id","order_stage",
]);

const cors = (origin: string | null) => ({
  ...(origin && ALLOWED_ORIGINS.has(origin) ? { "access-control-allow-origin": origin } : {}),
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-max-age": "600",
  "vary": "Origin",
});

const json = (status: number, body: Record<string, unknown>, origin: string | null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...cors(origin),
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

const cleanString = (value: unknown, max = 180) => {
  let s = String(value ?? "").slice(0, max);
  s = s.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]");
  s = s.replace(/(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?9?\d{4}[-\s]?\d{4}/g, "[phone]");
  s = s.replace(/[?#].*$/, "");
  return s.trim();
};

const cleanMeta = (input: unknown) => {
  const out: Record<string, string> = {};
  if (!input || typeof input !== "object" || Array.isArray(input)) return out;
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (!META_KEYS.has(key)) continue;
    const clean = cleanString(value, key === "error_message" ? 240 : 100);
    if (clean) out[key] = clean;
  }
  return out;
};

const sha256 = async (value: string) => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
};

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return json(403, { error: "origin_not_allowed" }, origin);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" }, origin);

  const type = req.headers.get("content-type") || "";
  if (!type.toLowerCase().startsWith("application/json")) {
    return json(415, { error: "unsupported_media_type" }, origin);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "invalid_json" }, origin);
  }

  const sessionId = cleanString(payload.session_id, 36);
  const eventName = cleanString(payload.event_name, 40);
  const page = cleanString(payload.page, 160);
  const metricValue = payload.metric_value == null ? null : Number(payload.metric_value);
  const metadata = cleanMeta(payload.metadata);

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)) {
    return json(400, { error: "invalid_session_id" }, origin);
  }
  if (!EVENTS.has(eventName)) return json(400, { error: "invalid_event" }, origin);
  if (!page || page.length > 160 || !page.startsWith("/")) return json(400, { error: "invalid_page" }, origin);
  if (metricValue != null && (!Number.isFinite(metricValue) || Math.abs(metricValue) > 1_000_000)) {
    return json(400, { error: "invalid_metric_value" }, origin);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const adminKey = readAdminKey();
  if (!url || !adminKey) return json(503, { error: "server_not_configured" }, origin);

  const admin = createClient(url, adminKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count, error: countError } = await admin
    .from("padoka_client_events")
    .select("id", { head: true, count: "exact" })
    .eq("session_id", sessionId)
    .gte("created_at", oneMinuteAgo);

  if (countError) return json(503, { error: "telemetry_unavailable" }, origin);
  if ((count || 0) >= 90) return json(429, { error: "rate_limited" }, origin);

  const { error: insertError } = await admin.from("padoka_client_events").insert({
    session_id: sessionId,
    event_name: eventName,
    page,
    metric_value: metricValue,
    metadata,
  });
  if (insertError) return json(503, { error: "telemetry_unavailable" }, origin);

  if (eventName === "client_error") {
    const title = cleanString(metadata.error_message || metadata.error_name || "Erro de cliente", 220) || "Erro de cliente";
    const fingerprint = (await sha256(`${page}|${metadata.error_name || ""}|${title}`)).slice(0, 64);
    const now = new Date().toISOString();

    const { data: existing } = await admin
      .from("padoka_incidents")
      .select("id,occurrence_count,status")
      .eq("fingerprint", fingerprint)
      .maybeSingle();

    if (existing?.id) {
      await admin.from("padoka_incidents").update({
        occurrence_count: Number(existing.occurrence_count || 0) + 1,
        last_seen_at: now,
        status: existing.status === "resolved" ? "monitoring" : existing.status,
        sample: { page, ...metadata },
      }).eq("id", existing.id);
    } else {
      await admin.from("padoka_incidents").insert({
        fingerprint,
        severity: "error",
        status: "open",
        source: "browser",
        title,
        sample: { page, ...metadata },
      });
    }
  }

  return json(202, { accepted: true }, origin);
});
