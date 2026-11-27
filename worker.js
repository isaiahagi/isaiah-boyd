import { DurableObject } from "cloudflare:workers";

const HOUR = 60 * 60 * 1000;

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

// Keeps one shared copy of the Artificial Analysis data. The free API allows 100 requests a day,
// so it refreshes every 6 hours at most, and waits an hour after a failed try.
export class Benchmarks extends DurableObject {
  async get() {
    const saved = await this.ctx.storage.get(["data", "triedAt"]);
    const data = saved.get("data");
    const now = Date.now();
    const fresh = data && now - data.updated < 6 * HOUR;
    if (fresh || !this.env.AA_API_KEY || now - (saved.get("triedAt") || 0) < HOUR) return data || null;

    await this.ctx.storage.put("triedAt", now);
    try {
      const models = [];
      for (let page = 1, more = true; more && page <= 10; page++) {
        const res = await fetch(`https://artificialanalysis.ai/api/v2/language/models/free?page=${page}`, {
          headers: { "x-api-key": this.env.AA_API_KEY },
        });
        if (!res.ok) throw new Error(`Artificial Analysis returned ${res.status}`);
        const body = await res.json();
        models.push(...body.data.map((m) => ({
          name: m.name,
          creator: m.model_creator?.name ?? "",
          intelligence: m.evaluations?.artificial_analysis_intelligence_index ?? null,
          speed: m.performance_v3?.mean_output_tokens_per_second ?? null,
          input: m.pricing?.price_1m_input_tokens ?? null,
          output: m.pricing?.price_1m_output_tokens ?? null,
        })));
        more = body.pagination?.has_more;
      }
      const next = { updated: now, models };
      await this.ctx.storage.put("data", next);
      return next;
    } catch (error) {
      console.error(error);
      return data || null;
    }
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

    if (url.pathname === "/api/benchmarks") {
      if (request.method !== "GET") return new Response(null, { status: 405, headers: { Allow: "GET" } });
      const data = await env.BENCHMARKS.get(env.BENCHMARKS.idFromName("artificial-analysis")).get();
      if (!data) return Response.json({ error: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
      return Response.json(data, { headers: { "Cache-Control": "public, max-age=900" } });
    }

    if (url.hostname !== "learnai.isaiahboyd.xyz") {
      return env.ASSETS.fetch(request);
    }

    url.pathname = "/learnai" + url.pathname;
    const response = await env.ASSETS.fetch(new Request(url, request));

    // redirects point inside /learnai, which this subdomain adds by itself
    const location = response.headers.get("Location");
    if (!location?.startsWith("/learnai/")) return response;
    const fixed = new Response(response.body, response);
    fixed.headers.set("Location", location.slice("/learnai".length));
    return fixed;
  }
};
