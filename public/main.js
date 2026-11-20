(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Year */
  const yr = $("#yr");
  if (yr) yr.textContent = new Date().getFullYear();

  /* About statement: split into words that light up as you scroll through it */
  const stmt = $(".statement");
  let words = [];
  if (stmt) {
    const wrap = (node) => {
      Array.from(node.childNodes).forEach((c) => {
        if (c.nodeType === 3) {
          const frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const s = document.createElement("span");
            s.className = "w"; s.textContent = part; frag.append(s);
          });
          c.replaceWith(frag);
        } else if (c.nodeType === 1) wrap(c);
      });
    };
    wrap(stmt);
    words = $$(".w", stmt);
  }
  const lightWords = () => {
    if (!words.length) return;
    if (reduce) { words.forEach((w) => w.classList.add("on")); return; }
    const r = stmt.getBoundingClientRect();
    const p = (innerHeight * 0.88 - r.top) / (r.height + innerHeight * 0.3);
    const lit = Math.max(0, Math.min(1, p)) * words.length * 1.05;
    words.forEach((w, i) => w.classList.toggle("on", i < lit));
  };

  /* Scroll progress (one rAF-throttled listener) */
  const bar = $(".progress i");
  let ticking = false;
  const paint = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(scrollY / max, 1) : 0})`;
    lightWords();
    ticking = false;
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }, { passive: true });
  addEventListener("resize", paint, { passive: true });
  paint();

  /* Hero dot field: quiet wave, brightens around the pointer. Paused off-screen. */
  const cv = $(".field");
  if (cv && cv.getContext) {
    const ctx = cv.getContext("2d");
    const hero = cv.parentElement;
    const S = 32;
    let w = 0, h = 0, dpr = 1, raf = 0, running = false, px = -9999, py = -9999, tx = -9999, ty = -9999;
    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = hero.clientWidth; h = hero.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const frame = (t) => {
      px += (tx - px) * 0.14; py += (ty - py) * 0.14;
      ctx.clearRect(0, 0, w, h);
      const cols = Math.ceil(w / S), rows = Math.ceil(h / S);
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * S + S / 2, y = j * S + S / 2;
          const wave = 0.5 + 0.5 * Math.sin(i * 0.33 + j * 0.27 + t * 0.0007);
          const d = Math.hypot(x - px, y - py);
          const near = Math.max(0, 1 - d / 190);
          const s = 1.6 + wave * 1.2 + near * near * 7;
          ctx.globalAlpha = Math.min(1, 0.07 + wave * 0.1 + near * 0.9);
          ctx.fillStyle = near > 0.12 ? "#d4ff3a" : "#ffffff";
          ctx.fillRect(x - s / 2, y - s / 2, s, s);
        }
      }
      ctx.globalAlpha = 1;
      if (running) raf = requestAnimationFrame(frame);
    };
    const start = () => { if (!running && !reduce && !document.hidden) { running = true; raf = requestAnimationFrame(frame); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    size();
    frame(0);
    if (!reduce) {
      hero.addEventListener("pointermove", (e) => { const r = hero.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; }, { passive: true });
      hero.addEventListener("pointerleave", () => { tx = ty = -9999; });
      if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(hero);
      else start();
      document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    }
    let rt;
    addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { size(); if (!running) frame(0); }, 120); }, { passive: true });
  }

  /* Reveal on scroll, staggered within a shared parent */
  const items = $$("[data-reveal]");
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    const seen = new Map();
    items.forEach((el) => {
      const n = seen.get(el.parentElement) || 0;
      seen.set(el.parentElement, n + 1);
      el.style.setProperty("--d", `${Math.min(n, 5) * 0.06}s`);
      io.observe(el);
    });
  } else {
    items.forEach((el) => el.classList.add("in"));
  }

  /* Active nav link */
  const links = $$(".nav a");
  const map = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => { a.classList.remove("is-active"); a.removeAttribute("aria-current"); });
        const a = map.get(e.target.id);
        if (a) { a.classList.add("is-active"); a.setAttribute("aria-current", "true"); }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("main section[id]").forEach((s) => spy.observe(s));
  }

  /* Mobile menu */
  const menu = $(".menu");
  const nav = $("#nav");
  const setMenu = (open) => {
    menu.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("open", open);
  };
  menu.addEventListener("click", () => setMenu(menu.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && nav.classList.contains("open")) { setMenu(false); menu.focus(); } });
  matchMedia("(min-width: 861px)").addEventListener("change", () => setMenu(false));

  /* Copy Discord handle */
  const copyBtn = $("[data-copy]");
  const status = $("#copy-status");
  if (copyBtn) {
    const label = $("i", copyBtn);
    let t;
    copyBtn.addEventListener("click", async () => {
      const text = copyBtn.dataset.copy;
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; } catch {
        const ta = document.createElement("textarea");
        ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        try { ok = document.execCommand("copy"); } catch { /* ignore */ }
        ta.remove();
      }
      label.textContent = ok ? "Copied" : "Press Ctrl+C";
      status.textContent = ok ? "Discord username copied to clipboard" : "Copy failed";
      clearTimeout(t);
      t = setTimeout(() => { label.textContent = "Copy"; status.textContent = ""; }, 1800);
    });
  }

  /* ───────── Experiment 1: uniform symmetric quantization ───────── */
  const qSvg = $("#q-svg");
  if (qSvg) {
    const N = 64;
    // Deterministic synthetic "weights": a few sines plus seeded noise, roughly bell-shaped in range.
    let seed = 7;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) - 0.5;
    const w = Array.from({ length: N }, (_, i) => {
      const x = i / N;
      return 0.55 * Math.sin(x * 6.2 * Math.PI) * Math.exp(-((x - 0.5) ** 2) * 2) + 0.35 * Math.sin(x * 17) * 0.6 + rnd() * 0.3;
    });
    const maxAbs = Math.max(...w.map(Math.abs));
    const input = $("#q-bits");
    const out = $("#q-out");
    const W = 640, H = 220, mid = H / 2, bw = W / N, sc = (H / 2 - 14) / maxAbs;
    const NS = "http://www.w3.org/2000/svg";
    const el = (n, a) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };

    qSvg.append(el("line", { x1: 0, x2: W, y1: mid, y2: mid, stroke: "currentColor", "stroke-opacity": ".3", "stroke-width": 1, "vector-effect": "non-scaling-stroke" }));
    const bars = [], dots = [];
    for (let i = 0; i < N; i++) {
      const b = el("rect", { x: i * bw + 1, width: Math.max(bw - 2, 1), fill: "var(--accent)", "fill-opacity": ".85" });
      const d = el("rect", { x: i * bw, width: bw, height: 2.5, fill: "var(--ink)" });
      bars.push(b); dots.push(d);
      qSvg.append(b);
    }
    dots.forEach((d) => qSvg.append(d));

    const draw = () => {
      const bits = +input.value;
      const levels = 2 ** bits;
      const qmax = 2 ** (bits - 1) - 1;
      const scale = maxAbs / qmax;
      let err = 0;
      w.forEach((v, i) => {
        const q = Math.max(-qmax, Math.min(qmax, Math.round(v / scale))) * scale;
        err += Math.abs(q - v);
        const y0 = mid - q * sc, h = Math.abs(q * sc);
        bars[i].setAttribute("y", q >= 0 ? y0 : mid);
        bars[i].setAttribute("height", Math.max(h, 0.5));
        dots[i].setAttribute("y", mid - v * sc - 1.25);
      });
      const mae = err / N;
      out.textContent = `${bits}-bit · ${levels} levels · mean error ${(mae / maxAbs * 100).toFixed(1)}%`;
      input.setAttribute("aria-valuetext", `${bits} bits, ${levels} levels`);
    };
    input.addEventListener("input", draw);
    draw();
  }

  /* ───────── Experiment 2: tiny byte-pair encoder ───────── */
  const tIn = $("#t-in");
  if (tIn) {
    const corpus = `
      Large language models read text as tokens, not as words. Tokenization splits text into pieces that the model can embed.
      Byte pair encoding starts from single characters and repeatedly merges the most frequent neighbouring pair into a new token.
      Training a model means adjusting weights with gradient descent. Quantization stores those weights with fewer bits so inference
      is smaller and faster. Open weight models can run locally, and local inference keeps data on the device.
      The model architecture stacks attention layers. Each layer mixes information between tokens and passes it to the next layer.
      Building small experiments is the best way to learn how a language model works. I like to test, measure and iterate.
      Quantization and tokenization are practical topics: they change memory use, speed and cost of every model.
    `;
    const PRE = /\s?[\p{L}]+|\s?[\p{N}]+|\s?[^\s\p{L}\p{N}]+|\s+/gu;

    const train = (text, merges) => {
      const freq = new Map();
      (text.match(PRE) || []).forEach((p) => freq.set(p, (freq.get(p) || 0) + 1));
      let words = [...freq].map(([p, c]) => ({ s: Array.from(p), c }));
      const rank = new Map();
      for (let m = 0; m < merges; m++) {
        const pairs = new Map();
        for (const { s, c } of words) for (let i = 0; i < s.length - 1; i++) {
          const k = s[i] + "\u0000" + s[i + 1];
          pairs.set(k, (pairs.get(k) || 0) + c);
        }
        let best = null, bc = 1;
        for (const [k, c] of pairs) if (c > bc) { best = k; bc = c; }
        if (!best) break;
        rank.set(best, m);
        const [a, b] = best.split("\u0000");
        for (const wd of words) {
          const o = [];
          for (let i = 0; i < wd.s.length; i++) {
            if (wd.s[i] === a && wd.s[i + 1] === b) { o.push(a + b); i++; } else o.push(wd.s[i]);
          }
          wd.s = o;
        }
      }
      return rank;
    };
    const rank = train(corpus, 220);

    const encode = (text) => {
      const toks = [];
      for (const p of text.match(PRE) || []) {
        let s = Array.from(p);
        for (;;) {
          let bi = -1, br = Infinity;
          for (let i = 0; i < s.length - 1; i++) {
            const r = rank.get(s[i] + "\u0000" + s[i + 1]);
            if (r !== undefined && r < br) { br = r; bi = i; }
          }
          if (bi < 0) break;
          s = [...s.slice(0, bi), s[bi] + s[bi + 1], ...s.slice(bi + 2)];
        }
        toks.push(...s);
      }
      return toks;
    };

    const tOut = $("#t-out"), tStat = $("#t-stat");
    const render = () => {
      const text = tIn.value.slice(0, 400);
      const toks = encode(text);
      tOut.replaceChildren(...toks.map((t) => {
        const s = document.createElement("span");
        s.textContent = t.replace(/^ /, "·").replace(/\n/g, "↵");
        return s;
      }));
      const chars = Array.from(text).length;
      tStat.textContent = chars ? `${toks.length} tokens · ${chars} characters · ${(chars / toks.length).toFixed(2)} chars per token` : "Type something above.";
    };
    let raf = 0;
    tIn.addEventListener("input", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(render); });
    render();
  }
})();
