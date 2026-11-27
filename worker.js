import { DurableObject } from "cloudflare:workers";

// Counts unique visitors. Only salted hashes of IP addresses are stored, never the addresses.
export class VisitorCounter extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS visitors (id TEXT PRIMARY KEY)");
    ctx.blockConcurrencyWhile(async () => {
      this.salt = await ctx.storage.get("salt");
      if (!this.salt) {
        this.salt = crypto.randomUUID();
        await ctx.storage.put("salt", this.salt);
      }
    });
  }

  count() {
    return this.ctx.storage.sql.exec("SELECT COUNT(*) AS n FROM visitors").one().n;
  }

  async add(ip) {
    const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(this.salt + ip));
    const id = [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
    this.ctx.storage.sql.exec("INSERT OR IGNORE INTO visitors (id) VALUES (?)", id);
    return this.count();
  }
}

// GET reads the total, POST records this visitor and returns the total.
async function visitors(request, env, url) {
  const counter = env.VISITORS.get(env.VISITORS.idFromName("learnai"));
  let count;

  if (request.method === "GET") {
    count = await counter.count();
  } else if (request.method === "POST") {
    // only the page itself may record a visit
    if (request.headers.get("Origin") !== url.origin) return new Response(null, { status: 403 });
    const ip = request.headers.get("CF-Connecting-IP");
    const bot = /bot|crawl|spider|preview|headless/i.test(request.headers.get("User-Agent") || "");
    count = ip && !bot ? await counter.add(ip) : await counter.count();
  } else {
    return new Response(null, { status: 405, headers: { Allow: "GET, POST" } });
  }

  return Response.json({ count }, { headers: { "Cache-Control": "no-store" } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/visitors") {
      return visitors(request, env, url);
    }

    if (url.hostname === "learnai.isaiahboyd.xyz") {
      url.pathname = "/learnai" + url.pathname;
    }

    return env.ASSETS.fetch(new Request(url, request));
  }
};
