(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasIO = "IntersectionObserver" in window;

  const yr = $("#yr");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ───────── Scroll: progress bar + stacking experience cards ───────── */
  const bar = $(".progress i");
  const stack = $$("[data-stack]");
  const wide = matchMedia("(min-width: 861px)");
  const updateStack = () => {
    if (!stack.length) return;
    if (!wide.matches || reduce) { stack.forEach((c) => c.style.removeProperty("--s")); return; }
    // Progress of each card arriving at its resting spot (0 = far away, 1 = arrived)
    const arrive = stack.map((c, i) => {
      if (i === 0) return 0;
      const top = c.getBoundingClientRect().top;
      return clamp(1 - (top - (92 + i * 18)) / 420, 0, 1);
    });
    stack.forEach((c, i) => {
      let sum = 0;
      for (let j = i + 1; j < stack.length; j++) sum += arrive[j];
      c.style.setProperty("--s", (1 - 0.035 * sum).toFixed(4));
    });
  };
  let ticking = false;
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? clamp(scrollY / max, 0, 1) : 0})`;
    updateStack();
    ticking = false;
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener("resize", onScroll, { passive: true });
  onScroll();

  /* ───────── Reveal on scroll (staggered per parent) ───────── */
  const items = $$("[data-reveal]");
  if (hasIO && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -7% 0px", threshold: 0.06 });
    const seen = new Map();
    items.forEach((el) => {
      const n = seen.get(el.parentElement) || 0;
      seen.set(el.parentElement, n + 1);
      el.style.setProperty("--d", `${Math.min(n, 6) * 0.07}s`);
      io.observe(el);
    });
  } else items.forEach((el) => el.classList.add("in"));

  /* ───────── Nav: sliding pill indicator, scroll-spy, mobile menu ───────── */
  const pills = $("#nav");
  const ind = $(".nav__ind");
  const links = $$("a:not(.nav__cta-m)", pills);
  let active = null;
  const place = (a) => {
    if (!a || !wide.matches) { ind.style.opacity = 0; return; }
    ind.style.width = `${a.offsetWidth}px`;
    ind.style.transform = `translateX(${a.offsetLeft}px)`;
    ind.style.opacity = 1;
  };
  links.forEach((a) => {
    a.addEventListener("pointerenter", () => place(a));
    a.addEventListener("focus", () => place(a));
  });
  pills.addEventListener("pointerleave", () => place(active));
  pills.addEventListener("focusout", () => place(active));
  const setActive = (id) => {
    active = links.find((a) => a.getAttribute("href") === `#${id}`) || null;
    links.forEach((a) => { const on = a === active; a.classList.toggle("is-active", on); on ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current"); });
    place(active);
  };
  if (hasIO) {
    const spy = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); }), { rootMargin: "-45% 0px -50% 0px" });
    $$("main section[id]").forEach((s) => spy.observe(s));
  }
  addEventListener("scroll", () => { if (scrollY < 200) setActive(""); }, { passive: true });
  addEventListener("resize", () => place(active), { passive: true });

  const menu = $(".nav__menu");
  const setMenu = (open) => { menu.setAttribute("aria-expanded", String(open)); pills.classList.toggle("open", open); };
  menu.addEventListener("click", () => setMenu(menu.getAttribute("aria-expanded") !== "true"));
  pills.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && pills.classList.contains("open")) { setMenu(false); menu.focus(); } });
  wide.addEventListener("change", () => { setMenu(false); place(active); });

  /* ───────── Dithered halftone gradient fields (hero + contact) ───────── */
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const pack = (c) => (255 << 24) | (c[2] << 16) | (c[1] << 8) | c[0];
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16 - 0.5);

  const dither = (canvas, { palette, cell, field, interactive }) => {
    const ctx = canvas.getContext("2d");
    const frame = canvas.parentElement;
    const cols = palette.map((h) => pack(hex(h)));
    const L = cols.length - 1;
    let w = 0, h = 0, img, buf, raf = 0, running = false, last = 0;
    let px = 0.5, py = 0.5, tx = 0.5, ty = 0.5, pk = 0, tk = 0;

    const size = () => {
      const r = frame.getBoundingClientRect();
      w = Math.max(8, Math.ceil(r.width / cell));
      h = Math.max(8, Math.ceil(r.height / cell));
      canvas.width = w; canvas.height = h;
      img = ctx.createImageData(w, h);
      buf = new Uint32Array(img.data.buffer);
    };
    const draw = (t) => {
      px += (tx - px) * 0.08; py += (ty - py) * 0.08; pk += (tk - pk) * 0.06;
      const asp = w / h;
      for (let y = 0; y < h; y++) {
        const ny = y / h;
        for (let x = 0; x < w; x++) {
          const nx = x / w;
          let v = field(nx, ny, t, asp);
          if (pk > 0.001) {
            const dx = (nx - px) * asp, dy = ny - py;
            v += pk * 0.55 * Math.exp(-(dx * dx + dy * dy) / 0.035);
          }
          const val = clamp(v, 0, 1) * L + BAYER[(y & 3) * 4 + (x & 3)] * 0.95;
          buf[y * w + x] = cols[clamp(Math.round(val), 0, L)];
        }
      }
      ctx.putImageData(img, 0, 0);
    };
    const loop = (now) => {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      if (now - last < 42) return; // ~24fps is plenty for a slow field
      last = now;
      draw(now * 0.00032);
    };
    const start = () => { if (!running && !reduce && !document.hidden) { running = true; raf = requestAnimationFrame(loop); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    size(); draw(2.4);
    if (!reduce) {
      if (interactive && canHover) {
        frame.addEventListener("pointermove", (e) => { const r = frame.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width; ty = (e.clientY - r.top) / r.height; tk = 1; }, { passive: true });
        frame.addEventListener("pointerleave", () => { tk = 0; });
      }
      if (hasIO) new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(frame); else start();
      document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    }
    let rt;
    if ("ResizeObserver" in window) new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => { size(); draw(2.4); }, 120); }).observe(frame);
  };

  const heroCv = $("#dither-hero");
  if (heroCv) dither(heroCv, {
    palette: ["#f3f5fc", "#e4eaff", "#c3d1ff", "#93aaff", "#5b80ff", "#2b59ff"],
    cell: matchMedia("(max-width: 640px)").matches ? 4 : 5,
    interactive: true,
    field: (nx, ny, t, asp) => {
      const a = Math.pow(ny, 1.7);
      const flow = 0.5 + 0.5 * Math.sin(nx * 4.2 + t * 1.5 + Math.sin(ny * 3.1 - t * 1.1) * 1.5);
      const side = Math.pow(Math.abs(nx - 0.5) * 2, 2.2) * 0.5;
      return a * (0.5 + 0.5 * flow) + side * (0.15 + 0.5 * ny);
    },
  });
  const ctaCv = $("#dither-cta");
  if (ctaCv) dither(ctaCv, {
    palette: ["#0b0d1c", "#10153a", "#18247a", "#2b59ff", "#7f9cff"],
    cell: 5,
    interactive: true,
    field: (nx, ny, t) => {
      const flow = 0.5 + 0.5 * Math.sin(nx * 5 - t * 1.4 + Math.sin(ny * 2.6 + t) * 1.3);
      const a = Math.pow(ny, 2.2);
      const edge = Math.pow(Math.abs(nx - 0.5) * 2, 2) * 0.35 * ny;
      return (a * (0.55 + 0.6 * flow) + edge) * (0.5 + 0.5 * ny);
    },
  });

  /* ───────── Hero deck: gentle 3D tilt toward the pointer ───────── */
  const deck = $(".deck");
  const frame = $(".hero__frame");
  if (deck && frame && canHover && !reduce) {
    frame.addEventListener("pointermove", (e) => {
      const r = frame.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      deck.style.setProperty("--ry", `${(x * 7).toFixed(2)}deg`);
      deck.style.setProperty("--rx", `${(-y * 4).toFixed(2)}deg`);
    }, { passive: true });
    frame.addEventListener("pointerleave", () => { deck.style.setProperty("--ry", "0deg"); deck.style.setProperty("--rx", "0deg"); });
  }

  /* ───────── Card spotlight + magnetic buttons ───────── */
  if (canHover) {
    document.addEventListener("pointermove", (e) => {
      const c = e.target.closest && e.target.closest("[data-spot]");
      if (!c) return;
      const r = c.getBoundingClientRect();
      c.style.setProperty("--mx", `${e.clientX - r.left}px`);
      c.style.setProperty("--my", `${e.clientY - r.top}px`);
    }, { passive: true });
    if (!reduce) $$("[data-magnet]").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        b.style.setProperty("--tx", `${clamp((e.clientX - r.left - r.width / 2) * 0.18, -8, 8).toFixed(1)}px`);
        b.style.setProperty("--ty", `${clamp((e.clientY - r.top - r.height / 2) * 0.28, -6, 6).toFixed(1)}px`);
      });
      b.addEventListener("pointerleave", () => { b.style.setProperty("--tx", "0px"); b.style.setProperty("--ty", "0px"); });
    });
  }

  /* ───────── Copy Discord handle ───────── */
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
      label.textContent = ok ? "Copied" : "Ctrl+C";
      status.textContent = ok ? "Discord username copied to clipboard" : "Copy failed";
      clearTimeout(t);
      t = setTimeout(() => { label.textContent = "Copy"; status.textContent = ""; }, 1800);
    });
  }

  /* ───────── Experiment 1: uniform symmetric quantization ───────── */
  const qSvg = $("#q-svg");
  if (qSvg) {
    const N = 64;
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

    qSvg.append(el("line", { x1: 0, x2: W, y1: mid, y2: mid, stroke: "currentColor", "stroke-opacity": ".25", "stroke-width": 1, "vector-effect": "non-scaling-stroke" }));
    const bars = [], dots = [];
    for (let i = 0; i < N; i++) {
      const b = el("rect", { x: i * bw + 1, width: Math.max(bw - 2, 1), rx: 1.5, fill: "#2b59ff", "fill-opacity": ".85" });
      const d = el("rect", { x: i * bw, width: bw, height: 2.5, fill: "#111113" });
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
      out.textContent = `${bits}-bit · ${levels} levels · mean error ${(err / N / maxAbs * 100).toFixed(1)}%`;
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
      const words = [...freq].map(([p, c]) => ({ s: Array.from(p), c }));
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
