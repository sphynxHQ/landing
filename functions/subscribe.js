// Cloudflare Pages Function — POST /subscribe  { "email": "you@domain.com" }
// Stores signups in D1 (binding: SUBSCRIBERS). Dedupe happens in SQL, not in JS.
// GET /subscribe?token=… returns a CSV export; requires the ADMIN_TOKEN secret.
//
// Bindings (wrangler.toml or Pages dashboard):
//   [[d1_databases]]
//   binding       = "SUBSCRIBERS"
//   database_name = "sphynx-subscribers"
//   database_id   = "<id from `wrangler d1 create`>"
//   ADMIN_TOKEN   = "<long random string>"   # secret, not a plain var
//
// Schema: migrations/0001_subscribers.sql

const MAX_LEN = 254;
const CSV_PAGE = 5000;

function isEmail(v) {
  if (typeof v !== "string") return false;
  if (v.length < 6 || v.length > MAX_LEN) return false;
  if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(v)) return false;
  const at = v.lastIndexOf("@");
  const local = v.slice(0, at);
  const domain = v.slice(at + 1);
  if (local.length > 64 || domain.length > 255) return false;
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return false;
  if (domain.startsWith("-") || domain.endsWith("-") || domain.includes("..")) return false;
  if (!/^[A-Za-z0-9.-]+$/.test(domain)) return false;
  return true;
}

function json(status, payload, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });
}

export async function onRequestPost({ request, env }) {
  if (!env.SUBSCRIBERS) return json(500, { error: "d1 binding missing" });

  const len = Number(request.headers.get("content-length") ?? 0);
  if (len > 4096) return json(413, { error: "payload too large" });

  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "expected a JSON body" });
  }

  // honeypot: a real visitor never fills this, so a filled field means a bot.
  // Reply 200 so the bot cannot tell it was caught.
  if (typeof body?.website === "string" && body.website.trim() !== "") {
    return json(200, { ok: true });
  }

  const email = String(body?.email ?? "").trim().slice(0, MAX_LEN);
  if (!isEmail(email)) return json(400, { error: "not a valid email address" });

  const row = await env.SUBSCRIBERS.prepare(
    `INSERT INTO subscribers (email, created_at, country, referer)
     VALUES (?1, ?2, ?3, ?4)
     ON CONFLICT(email) DO NOTHING
     RETURNING id`
  )
    .bind(
      email,
      new Date().toISOString(),
      request.cf?.country ?? null,
      (request.headers.get("referer") ?? "").slice(0, 300) || null
    )
    .first();

  // no row back = address already on the list. Same answer as a fresh signup, so
  // nobody can use this endpoint to test whether an address is subscribed.
  return json(200, { ok: true });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? request.headers.get("x-admin-token");
  if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) return json(403, { error: "forbidden" });
  if (!env.SUBSCRIBERS) return json(500, { error: "d1 binding missing" });

  const since = Number(url.searchParams.get("after") ?? 0) || 0;

  const rows = [];
  let last = since;
  // one query per 5,000 rows, so a big export never trips the per-invocation query cap
  for (let i = 0; i < 10; i++) {
    const page = await env.SUBSCRIBERS.prepare(
      `SELECT id, email, created_at, country
         FROM subscribers
        WHERE id > ?1
        ORDER BY id
        LIMIT ?2`
    )
      .bind(last, CSV_PAGE)
      .all();

    const batch = page.results ?? [];
    rows.push(...batch);
    if (batch.length < CSV_PAGE) break;
    last = batch[batch.length - 1].id;
  }

  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [
    "id,email,subscribed_at,country",
    ...rows.map((r) => [r.id, r.email, r.created_at, r.country].map(esc).join(",")),
  ].join("\n");

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="sphynx-subscribers.csv"',
      "cache-control": "no-store",
    },
  });
}

export async function onRequest({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { allow: "GET, POST, OPTIONS" } });
  }
  return json(405, { error: "method not allowed" }, { allow: "GET, POST, OPTIONS" });
}
