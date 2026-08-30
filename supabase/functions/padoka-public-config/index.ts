import "jsr:@supabase/functions-js@2.112.4/edge-runtime.d.ts";

const ALLOWED_ORIGINS = new Set([
  "https://lucasjanoca.github.io",
  "https://padoka-da-villa.pages.dev",
]);

const corsHeaders = (origin: string | null) => ({
  ...(origin && ALLOWED_ORIGINS.has(origin) ? { "access-control-allow-origin": origin } : {}),
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "GET, OPTIONS",
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

const readPublishableKey = () => {
  try {
    const raw = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
    if (raw) {
      const parsed = JSON.parse(raw);
      const value = parsed?.default;
      if (typeof value === "string" && value.startsWith("sb_publishable_")) return value;
    }
  } catch {}
  const legacy = Deno.env.get("SUPABASE_ANON_KEY");
  return typeof legacy === "string" && legacy.length > 20 ? legacy : null;
};

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);

  if (origin && !ALLOWED_ORIGINS.has(origin)) return json(403, { error: "origin_not_allowed" }, origin);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "GET") return json(405, { error: "method_not_allowed" }, origin);

  const url = Deno.env.get("SUPABASE_URL");
  const publishableKey = readPublishableKey();
  if (!url || !publishableKey) return json(503, { error: "config_unavailable" }, origin);

  let googleEnabled = false;
  try {
    const settings = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: publishableKey },
      cache: "no-store",
    });
    if (settings.ok) {
      const body = await settings.json();
      googleEnabled = Boolean(body?.external?.google);
    }
  } catch {}

  return json(200, { url, publishableKey, scope: "padoka", googleEnabled }, origin);
});
