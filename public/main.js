(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasIO = "IntersectionObserver" in window;
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* ignore */ } },
  };

  const yr = $("#yr");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ───────── Theme ───────── */
  const themeBtn = $("#theme");
  const themeMeta = $("#theme-color");
  const syncTheme = () => {
    const t = root.dataset.theme;
    themeBtn.setAttribute("aria-label", t === "dark" ? "Switch to light theme" : "Switch to dark theme");
    if (themeMeta) themeMeta.content = t === "dark" ? "#0a0a0b" : "#fafafa";
  };
  const setTheme = (t) => { root.dataset.theme = t; try { localStorage.setItem("theme", t); } catch { /* ignore */ } syncTheme(); };
  const toggleTheme = () => setTheme(root.dataset.theme === "dark" ? "light" : "dark");
  themeBtn.addEventListener("click", toggleTheme);
  syncTheme();

  /* ───────── Smooth scroll (Lenis) ───────── */
  let lenis = null;
  if (!reduce && typeof window.Lenis === "function") {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  const goTo = (id) => {
    const el = id === "#top" ? null : $(id);
    if (id !== "#top" && !el) return;
    if (lenis) lenis.scrollTo(el || 0, { offset: -68, duration: 1.3, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else if (el) el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    else scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    history.replaceState(null, "", id === "#top" ? location.pathname : id);
  };
  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    if (id.length < 2) return;
    e.preventDefault();
    goTo(id);
  });

  /* ───────── Scroll state: progress, header border, section spy ───────── */
  const bar = $(".progress i");
  const top = $(".top");
  const tlinks = $$("#tnav a");
  const dockEl = $("#dock");
  const dlinks = $$("a", dockEl);
  const dInd = $(".dock__ind", dockEl);
  const order = ["#top", "#work", "#projects", "#showcase", "#stack", "#lab", "#activity", "#contact"];
  const secs = order.map((h) => (h === "#top" ? null : $(h)));
  let current = "";
  const spy = () => {
    let cur = "#top";
    const line = innerHeight * 0.35;
    for (let i = 1; i < secs.length; i++) if (secs[i] && secs[i].getBoundingClientRect().top <= line) cur = order[i];
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) cur = "#contact";
    if (cur === current) return;
    current = cur;
    tlinks.forEach((a) => { const on = a.getAttribute("href") === cur; a.classList.toggle("is-active", on); on ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current"); });
    let idx = -1;
    dlinks.forEach((a, i) => { const on = a.getAttribute("href") === cur; a.classList.toggle("is-active", on); if (on) idx = i; });
    // Dock has no #stack/#activity entry: highlight the nearest one before it
    if (idx < 0) { const k = order.indexOf(cur); for (let j = k; j >= 0 && idx < 0; j--) idx = dlinks.findIndex((a) => a.getAttribute("href") === order[j]); }
    if (dInd && idx >= 0) dInd.style.transform = `translateX(${5 + idx * 46}px)`;
  };
  let ticking = false;
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? clamp(scrollY / max, 0, 1) : 0})`;
    top.classList.toggle("scrolled", scrollY > 8);
    spy();
    ticking = false;
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener("resize", () => { current = ""; onScroll(); }, { passive: true });
  onScroll();

  /* ───────── Reveal on scroll ───────── */
  const items = $$("[data-reveal]");
  if (hasIO && !reduce) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    const seen = new Map();
    items.forEach((el) => {
      const n = seen.get(el.parentElement) || 0;
      seen.set(el.parentElement, n + 1);
      el.style.setProperty("--d", `${Math.min(n, 5) * 0.06}s`);
      io.observe(el);
    });
  } else items.forEach((el) => el.classList.add("in"));

  /* ───────── Card spotlight ───────── */
  if (canHover) document.addEventListener("pointermove", (e) => {
    const c = e.target.closest && e.target.closest(".tile");
    if (!c) return;
    const r = c.getBoundingClientRect();
    c.style.setProperty("--mx", `${e.clientX - r.left}px`);
    c.style.setProperty("--my", `${e.clientY - r.top}px`);
  }, { passive: true });

  /* ───────── Work accordion ───────── */
  $$(".job__btn").forEach((b) => b.addEventListener("click", () => {
    const job = b.closest(".job");
    const open = !job.classList.contains("is-open");
    job.classList.toggle("is-open", open);
    b.setAttribute("aria-expanded", String(open));
  }));

  /* ───────── Ball skin picker ───────── */
  const grid = $("#pk-grid");
  if (grid) {
    const btns = $$("button", grid);
    const img = $("#pk-img"), nm = $("#pk-t"), no = $("#pk-n");
    const select = (b, focus) => {
      btns.forEach((x) => { const on = x === b; x.setAttribute("aria-checked", String(on)); x.tabIndex = on ? 0 : -1; });
      const i = btns.indexOf(b) + 1;
      img.src = `img/balls/${b.dataset.f}.webp`;
      img.alt = `${b.dataset.n} ball skin`;
      nm.textContent = b.dataset.n;
      no.textContent = `${String(i).padStart(2, "0")} / ${btns.length}`;
      img.classList.remove("swap"); void img.offsetWidth; img.classList.add("swap");
      if (focus) b.focus();
    };
    btns.forEach((b, i) => {
      b.tabIndex = i === 0 ? 0 : -1;
      b.addEventListener("click", () => select(b));
      b.addEventListener("keydown", (e) => {
        const k = e.key; let j = -1;
        if (k === "ArrowRight" || k === "ArrowDown") j = (i + 1) % btns.length;
        else if (k === "ArrowLeft" || k === "ArrowUp") j = (i - 1 + btns.length) % btns.length;
        else if (k === "Home") j = 0; else if (k === "End") j = btns.length - 1;
        if (j >= 0) { e.preventDefault(); select(btns[j], true); }
      });
    });
  }

  /* ───────── Copy Discord handle ───────── */
  const status = $("#copy-status");
  $$("[data-copy]").forEach((btn) => {
    let t;
    btn.addEventListener("click", async () => {
      const text = btn.dataset.copy;
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; } catch {
        const ta = document.createElement("textarea");
        ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        try { ok = document.execCommand("copy"); } catch { /* ignore */ }
        ta.remove();
      }
      const span = $("span", btn), orig = btn.dataset.label || span.textContent;
      btn.dataset.label = orig;
      span.textContent = ok ? "Copied" : "Copy failed";
      status.textContent = ok ? "Discord username copied to clipboard" : "Copy failed";
      clearTimeout(t);
      t = setTimeout(() => { span.textContent = orig; status.textContent = ""; }, 1800);
    });
  });

  /* ───────── GitHub data: static snapshot first, live refresh second ───────── */
  const fmt = (n) => Number(n).toLocaleString("en-US");
  const gh = { followers: null, repos: null, contrib: null, repo: {} };
  const paintGh = () => {
    $$("[data-gh]").forEach((el) => {
      const [k, name] = el.dataset.gh.split(":");
      let v = null;
      if (k === "stars" || k === "forks") v = gh.repo[name] && gh.repo[name][k === "stars" ? "stars" : "forks"];
      else v = gh[k];
      if (v != null) el.textContent = fmt(v);
    });
  };
  const rel = (iso) => {
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    const steps = [[60, "second"], [60, "minute"], [24, "hour"], [7, "day"], [4.345, "week"], [12, "month"], [Infinity, "year"]];
    let v = s, unit = "second";
    for (const [div, u] of steps) { unit = u; if (Math.abs(v) < div) break; v /= div; }
    return rtf.format(-Math.round(v), unit);
  };

  const heatG = $("#heat-g"), heatM = $("#heat-m");
  const renderHeat = (start, days) => {
    if (!heatG || !days || !days.length) return;
    heatG.replaceChildren(); heatM.replaceChildren();
    const lvl = (c) => (c <= 0 ? 0 : c <= 2 ? 1 : c <= 5 ? 2 : c <= 11 ? 3 : 4);
    const d0 = new Date(`${start}T00:00:00Z`);
    const offset = d0.getUTCDay();
    const frag = document.createDocumentFragment();
    for (let i = 0; i < offset; i++) { const e = document.createElement("i"); e.style.visibility = "hidden"; frag.append(e); }
    let lastMonth = -1;
    days.forEach((c, i) => {
      const date = new Date(d0.getTime() + i * 864e5);
      const col = Math.floor((i + offset) / 7);
      const cell = document.createElement("i");
      const l = lvl(c);
      if (l) cell.className = `l${l}`;
      cell.style.setProperty("--w", col);
      cell.title = `${c} contribution${c === 1 ? "" : "s"} on ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}`;
      frag.append(cell);
      if ((i + offset) % 7 === 0 || i === 0) {
        const m = date.getUTCMonth();
        if (m !== lastMonth && (col === 0 ? date.getUTCDate() < 20 : true)) {
          lastMonth = m;
          const s = document.createElement("span");
          s.textContent = date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
          s.style.left = `${col * 12}px`;
          heatM.append(s);
        }
      }
    });
    heatG.append(frag);
    heatM.style.width = `${Math.ceil((days.length + offset) / 7) * 12}px`;
    const sc = heatG.parentElement; requestAnimationFrame(() => { sc.scrollLeft = sc.scrollWidth; });
  };
  const setContrib = (total, start, days, note) => {
    gh.contrib = total; paintGh();
    const t = $("#act-total"); if (t) t.textContent = `/ ${fmt(total)} contributions in the last year`;
    const n = $("#heat-note"); if (n) n.textContent = note;
    renderHeat(start, days);
  };
  const renderRecent = (list) => {
    const ul = $("#recent"); if (!ul || !list.length) return;
    ul.replaceChildren(...list.map((r) => {
      const li = document.createElement("li");
      const a = document.createElement("a"); a.className = "rrow rrow--s"; a.href = `https://github.com/isaiahagi/${r.name}`; a.rel = "noopener";
      const b = document.createElement("b"); b.textContent = r.name;
      const s = document.createElement("span"); s.textContent = r.desc || "";
      const em = document.createElement("em"); const tm = document.createElement("time"); tm.dateTime = r.pushed; tm.textContent = `pushed ${rel(r.pushed)}`; em.append(tm);
      a.append(b, s, em); li.append(a); return li;
    }));
  };
  const recentFrom = (repos) => Object.entries(repos)
    .filter(([n, r]) => n !== "izzyfrm" && r.desc !== undefined)
    .sort((a, b) => new Date(b[1].pushed) - new Date(a[1].pushed)).slice(0, 5)
    .map(([name, r]) => ({ name, desc: r.desc, pushed: r.pushed }));

  const getJSON = async (url, key, ttl = 900000) => {
    const c = store.get(key);
    if (c) { try { const o = JSON.parse(c); if (Date.now() - o.t < ttl) return o.d; } catch { /* ignore */ } }
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (!r.ok) throw new Error(String(r.status));
    const d = await r.json(); store.set(key, JSON.stringify({ t: Date.now(), d })); return d;
  };

  (async () => {
    let snap = null;
    try {
      snap = await (await fetch("data/github.json", { cache: "no-cache" })).json();
      gh.followers = snap.followers; gh.repos = snap.public_repos;
      Object.entries(snap.repos).forEach(([n, r]) => { gh.repo[n] = r; });
      setContrib(snap.contrib.total, snap.contrib.start, snap.contrib.days, `Public contributions on GitHub. Snapshot from ${new Date(snap.generated + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}.`);
      renderRecent(recentFrom(snap.repos));
    } catch { /* keep static HTML */ }

    // Live refresh (best effort; falls back silently)
    try {
      const [u, repos] = await Promise.all([
        getJSON("https://api.github.com/users/isaiahagi", "gh:user"),
        getJSON("https://api.github.com/users/isaiahagi/repos?per_page=100&sort=pushed", "gh:repos"),
      ]);
      gh.followers = u.followers; gh.repos = u.public_repos;
      const map = {};
      repos.forEach((r) => { map[r.name] = { stars: r.stargazers_count, forks: r.forks_count, pushed: r.pushed_at, desc: r.description || "" }; gh.repo[r.name] = map[r.name]; });
      paintGh();
      renderRecent(recentFrom(map));
    } catch { /* offline or rate limited */ }
    try {
      const c = await getJSON("https://github-contributions-api.jogruber.de/v4/isaiahagi?y=last", "gh:contrib", 3600000);
      const list = (c.contributions || []).filter((d) => d.date);
      if (list.length > 300) setContrib((c.total && c.total.lastYear) || list.reduce((s, d) => s + d.count, 0), list[0].date, list.map((d) => d.count), "Public contributions on GitHub. Live.");
    } catch { /* keep snapshot */ }
  })();

  /* ───────── Command palette ───────── */
  const cmd = $("#cmd");
  const cmdQ = $("#cmd-q");
  const cmdList = $("#cmd-list");
  const cmdEmpty = $("#cmd-empty");
  const ext = (url) => () => window.open(url, "_blank", "noopener");
  const nav = (id) => () => goTo(id);
  const copyDiscord = () => { const b = $("[data-copy]"); if (b) b.click(); };
  const ACTIONS = [
    { g: "Navigate", l: "Home", i: "home", h: "", run: nav("#top") },
    { g: "Navigate", l: "Work", i: "briefcase", h: "experience", run: nav("#work") },
    { g: "Navigate", l: "Projects", i: "layers", h: "", run: nav("#projects") },
    { g: "Navigate", l: "Showcase", i: "image", h: "basketball heroes", run: nav("#showcase") },
    { g: "Navigate", l: "Stack", i: "code", h: "tech", run: nav("#stack") },
    { g: "Navigate", l: "Lab", i: "flask", h: "ai experiments", run: nav("#lab") },
    { g: "Navigate", l: "Activity", i: "layers", h: "github", run: nav("#activity") },
    { g: "Navigate", l: "Contact", i: "mail", h: "", run: nav("#contact") },
    { g: "Projects", l: "roblox-ai", i: "github", h: "github", run: ext("https://github.com/isaiahagi/roblox-ai") },
    { g: "Projects", l: "Brickyard", i: "ur", h: "live site", run: ext("https://brickyard.ch") },
    { g: "Projects", l: "CatNews", i: "ur", h: "live site", run: ext("https://catnews.space") },
    { g: "Projects", l: "Opcoda", i: "ur", h: "live site", run: ext("https://opcoda.cc") },
    { g: "Projects", l: "roblox-ui-skill", i: "github", h: "github", run: ext("https://github.com/isaiahagi/roblox-ui-skill") },
    { g: "Projects", l: "claude-rpc", i: "github", h: "github", run: ext("https://github.com/isaiahagi/claude-rpc") },
    { g: "Links", l: "GitHub profile", i: "github", h: "isaiahagi", run: ext("https://github.com/isaiahagi") },
    { g: "Links", l: "X (Twitter)", i: "ur", h: "@IsaiahSrc", run: ext("https://x.com/IsaiahSrc") },
    { g: "Links", l: "Basketball Heroes Discord", i: "ur", h: "join", run: ext("https://discord.gg/2hnuRyEkvt") },
    { g: "Actions", l: "Copy Discord username", i: "copy", h: "isaiahai", run: copyDiscord },
    { g: "Actions", l: "Toggle theme", i: "sun", h: "light / dark", run: toggleTheme },
  ];
  let shown = [], sel = 0, lastFocus = null;
  const svg = (id) => { const s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("class", "ic"); s.setAttribute("width", "16"); s.setAttribute("height", "16"); const u = document.createElementNS("http://www.w3.org/2000/svg", "use"); u.setAttribute("href", `#i-${id}`); s.append(u); return s; };
  const renderCmd = () => {
    const q = cmdQ.value.trim().toLowerCase();
    shown = ACTIONS.filter((a) => !q || `${a.l} ${a.h} ${a.g}`.toLowerCase().includes(q));
    sel = clamp(sel, 0, Math.max(0, shown.length - 1));
    cmdList.replaceChildren();
    let g = "";
    shown.forEach((a, i) => {
      if (a.g !== g) { g = a.g; const h = document.createElement("li"); h.className = "cmd__g"; h.setAttribute("role", "presentation"); h.textContent = g; cmdList.append(h); }
      const li = document.createElement("li");
      li.className = `cmd__i${i === sel ? " is-sel" : ""}`; li.id = `cmd-o-${i}`; li.setAttribute("role", "option"); li.setAttribute("aria-selected", String(i === sel));
      const sp = document.createElement("span"); sp.textContent = a.l;
      li.append(svg(a.i), sp);
      if (a.h) { const em = document.createElement("em"); em.textContent = a.h; li.append(em); }
      li.addEventListener("pointermove", () => { if (sel !== i) { sel = i; mark(); } });
      li.addEventListener("click", () => run(i));
      cmdList.append(li);
    });
    cmdEmpty.hidden = shown.length > 0;
    cmdQ.setAttribute("aria-activedescendant", shown.length ? `cmd-o-${sel}` : "");
  };
  const mark = () => {
    $$(".cmd__i", cmdList).forEach((el, i) => { const on = i === sel; el.classList.toggle("is-sel", on); el.setAttribute("aria-selected", String(on)); if (on) el.scrollIntoView({ block: "nearest" }); });
    cmdQ.setAttribute("aria-activedescendant", `cmd-o-${sel}`);
  };
  const openCmd = () => {
    if (!cmd.hidden) return;
    lastFocus = document.activeElement; cmd.hidden = false; cmdQ.value = ""; sel = 0; renderCmd();
    if (lenis) lenis.stop(); else document.body.style.overflow = "hidden";
    cmdQ.focus();
  };
  const closeCmd = () => {
    if (cmd.hidden) return;
    cmd.hidden = true;
    if (lenis) lenis.start(); else document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  };
  const run = (i) => { const a = shown[i]; if (!a) return; closeCmd(); setTimeout(a.run, 60); };
  $("#open-cmd").addEventListener("click", openCmd);
  cmd.addEventListener("click", (e) => { if (e.target.hasAttribute("data-close")) closeCmd(); });
  cmdQ.addEventListener("input", () => { sel = 0; renderCmd(); });
  cmd.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { e.preventDefault(); closeCmd(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); if (shown.length) { sel = (sel + 1) % shown.length; mark(); } }
    else if (e.key === "ArrowUp") { e.preventDefault(); if (shown.length) { sel = (sel - 1 + shown.length) % shown.length; mark(); } }
    else if (e.key === "Enter") { e.preventDefault(); run(sel); }
    else if (e.key === "Tab") { e.preventDefault(); cmdQ.focus(); }
  });
  addEventListener("keydown", (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || "") || (e.target && e.target.isContentEditable);
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); cmd.hidden ? openCmd() : closeCmd(); }
    else if (e.key === "/" && !typing && cmd.hidden) { e.preventDefault(); openCmd(); }
  });

  /* ───────── Lab 1: uniform symmetric quantization ───────── */
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
      const b = el("rect", { x: i * bw + 1, width: Math.max(bw - 2, 1), rx: 1.5, fill: "var(--accent)", "fill-opacity": ".85" });
      const d = el("rect", { x: i * bw, width: bw, height: 2.5, fill: "currentColor" });
      bars.push(b); dots.push(d); qSvg.append(b);
    }
    dots.forEach((d) => qSvg.append(d));
    const draw = () => {
      const bits = +input.value, levels = 2 ** bits, qmax = 2 ** (bits - 1) - 1, scale = maxAbs / qmax;
      let err = 0;
      w.forEach((v, i) => {
        const q = Math.max(-qmax, Math.min(qmax, Math.round(v / scale))) * scale;
        err += Math.abs(q - v);
        bars[i].setAttribute("y", q >= 0 ? mid - q * sc : mid);
        bars[i].setAttribute("height", Math.max(Math.abs(q * sc), 0.5));
        dots[i].setAttribute("y", mid - v * sc - 1.25);
      });
      out.textContent = `${bits}-bit · ${levels} levels · mean error ${(err / N / maxAbs * 100).toFixed(1)}%`;
      input.setAttribute("aria-valuetext", `${bits} bits, ${levels} levels`);
    };
    input.addEventListener("input", draw);
    draw();
  }

  /* ───────── Lab 2: tiny byte-pair encoder ───────── */
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
        for (const { s, c } of words) for (let i = 0; i < s.length - 1; i++) { const k = s[i] + "\u0000" + s[i + 1]; pairs.set(k, (pairs.get(k) || 0) + c); }
        let best = null, bc = 1;
        for (const [k, c] of pairs) if (c > bc) { best = k; bc = c; }
        if (!best) break;
        rank.set(best, m);
        const [a, b] = best.split("\u0000");
        for (const wd of words) {
          const o = [];
          for (let i = 0; i < wd.s.length; i++) { if (wd.s[i] === a && wd.s[i + 1] === b) { o.push(a + b); i++; } else o.push(wd.s[i]); }
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
          for (let i = 0; i < s.length - 1; i++) { const r = rank.get(s[i] + "\u0000" + s[i + 1]); if (r !== undefined && r < br) { br = r; bi = i; } }
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
      tOut.replaceChildren(...toks.map((t) => { const s = document.createElement("span"); s.textContent = t.replace(/^ /, "·").replace(/\n/g, "↵"); return s; }));
      const chars = Array.from(text).length;
      tStat.textContent = chars ? `${toks.length} tokens · ${chars} characters · ${(chars / toks.length).toFixed(2)} chars per token` : "Type something above.";
    };
    let raf = 0;
    tIn.addEventListener("input", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(render); });
    render();
  }
})();
