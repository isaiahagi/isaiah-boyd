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

  /* ───────── Smooth scroll (Lenis) ───────── */
  let lenis = null;
  if (!reduce && typeof window.Lenis === "function") {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  const lockScroll = (on) => { if (lenis) (on ? lenis.stop() : lenis.start()); else document.body.style.overflow = on ? "hidden" : ""; };
  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    if (id.length < 2) return;
    const el = $(id);
    if (!el) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(el, { offset: -24, duration: 1.3, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    history.replaceState(null, "", id);
  });

  /* ───────── Progress bar ───────── */
  const bar = $(".progress i");
  let ticking = false;
  const onScroll = () => {
    const max = root.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? clamp(scrollY / max, 0, 1) : 0})`;
    ticking = false;
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener("resize", onScroll, { passive: true });
  onScroll();

  /* ───────── Reveal ───────── */
  const items = $$("[data-reveal]");
  if (hasIO && !reduce) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    const seen = new Map();
    items.forEach((el) => {
      const n = seen.get(el.parentElement) || 0;
      seen.set(el.parentElement, n + 1);
      el.style.setProperty("--d", `${Math.min(n, 4) * 0.06}s`);
      io.observe(el);
    });
  } else items.forEach((el) => el.classList.add("in"));

  /* ───────── Copy Discord username ───────── */
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
      const isText = btn.classList.contains("u-btn");
      const orig = btn.dataset.orig || (isText ? btn.textContent : btn.title);
      btn.dataset.orig = orig;
      if (isText) btn.textContent = ok ? "copied!" : "copy failed"; else btn.title = ok ? "Copied!" : "Copy failed";
      status.textContent = ok ? "Discord username copied to clipboard" : "Copy failed";
      clearTimeout(t);
      t = setTimeout(() => { if (isText) btn.textContent = orig; else btn.title = orig; status.textContent = ""; }, 1800);
    });
  });

  /* ───────── Ball skin picker ───────── */
  const grid = $("#pk-grid");
  const skins = grid ? $$("button", grid).map((b) => ({ n: b.dataset.n, f: b.dataset.f })) : [];
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

  /* ───────── Easter egg: ball polaroids ───────── */
  const egg = $("#egg"), pols = $("#pols"), eggBtn = $("#egg-open"), eggBg = $(".egg-ov__bg");
  if (egg && eggBtn && skins.length) {
    const tints = ["#2b2622", "#1d2c3d", "#3b2a1c", "#2c2140", "#1f3a33"];
    const rots = [-7, 4, -3, 6], ys = [0, 14, -6, 10];
    const openEgg = () => {
      const pick = skins.slice().sort(() => Math.random() - 0.5).slice(0, 4);
      pols.replaceChildren(...pick.map((s, i) => {
        const f = document.createElement("figure"); f.className = "pol";
        f.style.setProperty("--r", `${rots[i]}deg`); f.style.setProperty("--y", `${ys[i]}px`); f.style.setProperty("--i", i);
        const ph = document.createElement("div"); ph.className = "pol__ph"; ph.style.setProperty("--bgc", tints[(i + Math.floor(Math.random() * 5)) % tints.length]);
        const im = document.createElement("img"); im.src = `img/balls/${s.f}.webp`; im.alt = `${s.n} ball skin`; im.width = 268; im.height = 268;
        ph.append(im);
        const c = document.createElement("figcaption"); c.textContent = s.n.toLowerCase();
        f.append(ph, c); return f;
      }));
      egg.hidden = false; lockScroll(true); eggBg.focus();
    };
    const closeEgg = () => { if (egg.hidden) return; egg.hidden = true; lockScroll(false); eggBtn.focus(); };
    eggBtn.addEventListener("click", openEgg);
    eggBg.addEventListener("click", closeEgg);
    addEventListener("keydown", (e) => { if (egg.hidden) return; if (e.key === "Escape") closeEgg(); else if (e.key === "Tab") { e.preventDefault(); eggBg.focus(); } });
  }

  /* ───────── Pixel sky for Palm Coast, FL (live weather + time) ───────── */
  const NY = "America/New_York";
  const skyCv = $("#sky");
  const toggle = $("#sky-toggle");
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16 - 0.5);
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const pack = (c) => (255 << 24) | (c[2] << 16) | (c[1] << 8) | c[0];
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

  const sky = (() => {
    const ctx = skyCv.getContext("2d");
    const wrap = skyCv.parentElement;
    const PAL = {
      day: ["#0c0b0a", "#10213f", "#17335f", "#21497f", "#2f64a6", "#4a86cc"],
      dusk: ["#0c0b0a", "#24142a", "#4a2140", "#8a3a4a", "#d0643f", "#f0a05e"],
      night: ["#0c0b0a", "#0a1024", "#0e1836", "#142550", "#1d3a74", "#2a529c"],
    };
    const RAIN = { day: "#b4d3f8", dusk: "#f5d3ae", night: "#86abea" };
    const ACCENT = { day: "#8ab8f0", dusk: "#f0a368", night: "#9aabee" };
    const st = { phase: "day", cover: 0.2, rain: 0, snow: 0, fog: 0, thunder: false };
    let W = 0, H = 0, img, buf, ramp, rainHead = 0, rainTail = 0, parts = [], stars = [];
    let running = false, paused = false, raf = 0, last = 0, flash = 0, nextFlash = 0;

    const applyPhase = () => {
      ramp = PAL[st.phase].map((h) => pack(hex(h)));
      const rc = hex(RAIN[st.phase]);
      rainHead = pack(rc); rainTail = pack(mix(rc, hex(PAL[st.phase][3]), 0.6));
      root.style.setProperty("--sky", ACCENT[st.phase]);
    };
    const seed = () => {
      parts = [];
      const nRain = Math.floor(W * st.rain), nSnow = Math.floor(W * st.snow);
      for (let i = 0; i < nRain; i++) parts.push({ k: 0, x: Math.random() * (W + 20), y: Math.random() * H, v: 38 + Math.random() * 34, l: 3 + Math.floor(Math.random() * 3) });
      for (let i = 0; i < nSnow; i++) parts.push({ k: 1, x: Math.random() * W, y: Math.random() * H, v: 6 + Math.random() * 9, s: Math.random() * 6 });
      stars = Array.from({ length: Math.floor(W * H * 0.012) }, () => ({ x: Math.floor(Math.random() * W), y: Math.floor(Math.random() * H * 0.6), p: Math.random() * 6 }));
    };
    const size = () => {
      const cell = innerWidth < 640 ? 4 : 5;
      W = Math.max(8, Math.ceil(wrap.clientWidth / cell)); H = Math.max(8, Math.ceil(wrap.clientHeight / cell));
      skyCv.width = W; skyCv.height = H;
      img = ctx.createImageData(W, H); buf = new Uint32Array(img.data.buffer);
      seed();
    };
    const base = (ny) => {
      if (st.phase === "day") return Math.pow(1 - ny, 1.25) * 0.95;
      if (st.phase === "night") return Math.pow(1 - ny, 1.5) * 0.55;
      return 0.85 * Math.exp(-Math.pow((ny - 0.28) / 0.26, 2)) + 0.18 * (1 - ny);
    };
    const draw = (t, dt) => {
      if (st.thunder && t * 1000 > nextFlash) { flash = 1; nextFlash = t * 1000 + 5000 + Math.random() * 7000; }
      flash *= Math.pow(0.04, dt);
      for (let y = 0; y < H; y++) {
        const ny = y / H, b = base(ny);
        for (let x = 0; x < W; x++) {
          const nx = x / W;
          let I = b;
          if (st.cover > 0.05) {
            const n = 0.5 + 0.25 * (Math.sin(nx * 5.1 + t * 0.35 + 1.7 * Math.sin(ny * 4.2 + t * 0.2)) + Math.sin(nx * 11.3 - t * 0.5 + ny * 6.1));
            I *= (1 - 0.55 * st.cover) + 0.55 * st.cover * n * 1.35;
          }
          if (st.fog) I = I * (1 - st.fog) + 0.42 * st.fog * (1 - ny * 0.5);
          I += flash * 0.5 * (1 - ny);
          const v = clamp(Math.round(I * 5 + BAYER[(y & 3) * 4 + (x & 3)] * 0.9), 0, 5);
          buf[y * W + x] = ramp[v];
        }
      }
      if (st.phase === "night" && st.cover < 0.7) {
        const sc = pack([207, 217, 255]);
        stars.forEach((s) => { if (Math.sin(t * 2 + s.p) > -0.25 && buf[s.y * W + s.x] !== undefined) buf[s.y * W + s.x] = sc; });
      }
      const put = (x, y, c) => { x |= 0; y |= 0; if (x >= 0 && x < W && y >= 0 && y < H) buf[y * W + x] = c; };
      const snow = pack([232, 238, 252]);
      parts.forEach((p) => {
        if (p.k === 0) {
          p.y += p.v * dt; p.x += p.v * dt * 0.28;
          if (p.y > H) { p.y = -p.l; p.x = Math.random() * (W + 20) - 10; }
          put(p.x, p.y, rainHead);
          for (let k = 1; k <= p.l; k++) put(p.x - 0.28 * k, p.y - k, k > 1 ? rainTail : rainHead);
        } else {
          p.y += p.v * dt; p.x += Math.sin(t * 1.6 + p.s) * 0.18;
          if (p.y > H) { p.y = -1; p.x = Math.random() * W; }
          put(p.x, p.y, snow);
        }
      });
      ctx.putImageData(img, 0, 0);
    };
    const loop = (now) => {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      if (now - last < 42) return;
      const dt = Math.min(0.1, (now - last) / 1000 || 0.04); last = now;
      draw(now / 1000, dt);
    };
    const start = () => { if (!running && !paused && !reduce && !document.hidden) { running = true; last = performance.now(); raf = requestAnimationFrame(loop); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    applyPhase(); size(); draw(3.2, 0.04); skyCv.classList.add("on");
    if (!reduce) {
      if (hasIO) new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(wrap); else start();
      document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    }
    let rt;
    addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { size(); draw(3.2, 0.04); }, 150); }, { passive: true });

    return {
      set(next) { Object.assign(st, next); applyPhase(); seed(); if (!running) draw(3.2, 0.04); },
      phase: () => st.phase,
      toggle() { paused = !paused; paused ? stop() : start(); return paused; },
    };
  })();

  if (toggle) {
    if (reduce) { toggle.hidden = true; if (toggle.previousElementSibling) toggle.previousElementSibling.hidden = true; }
    else toggle.addEventListener("click", () => { const p = sky.toggle(); toggle.textContent = p ? "play sky" : "pause sky"; toggle.setAttribute("aria-pressed", String(p)); });
  }

  // Time in Palm Coast (Eastern), sunrise/sunset computed locally, and live conditions from the
  // National Weather Service (api.weather.gov: free, official, no key). Refreshed every 15 minutes.
  const LAT = 29.585, LON = -81.207;
  const clock = $("#clock"), wx = $("#wx"), wxDot = $("#wx-dot");
  const tf = new Intl.DateTimeFormat("en-US", { timeZone: NY, hour: "numeric", minute: "2-digit" });
  const hf = new Intl.DateTimeFormat("en-US", { timeZone: NY, hour: "numeric", minute: "numeric", hourCycle: "h23" });
  const nyMins = (d) => { const p = hf.formatToParts(d); return +p.find((x) => x.type === "hour").value * 60 + +p.find((x) => x.type === "minute").value; };
  const minsNow = () => nyMins(new Date());

  // NOAA sunrise equation (accurate to about a minute)
  const sunTimes = () => {
    const rad = Math.PI / 180, sin = (x) => Math.sin(x * rad);
    const jd = Date.now() / 864e5 + 2440587.5;
    const n = Math.ceil(jd - (2451545.0 + 0.0009) + 69.184 / 86400);
    const Js = n + 0.0009 - LON / 360; // LON is negative for west longitudes
    const M = (357.5291 + 0.98560028 * Js) % 360;
    const C = 1.9148 * sin(M) + 0.02 * sin(2 * M) + 0.0003 * sin(3 * M);
    const lam = (M + C + 180 + 102.9372) % 360;
    const Jt = 2451545.0 + Js + 0.0053 * sin(M) - 0.0069 * sin(2 * lam);
    const dec = Math.asin(sin(lam) * sin(23.4397));
    const cosw = (sin(-0.833) - sin(LAT) * Math.sin(dec)) / (Math.cos(LAT * rad) * Math.cos(dec));
    if (!isFinite(cosw) || Math.abs(cosw) > 1) return null;
    const w = Math.acos(cosw) / rad;
    const toDate = (j) => new Date((j - 2440587.5) * 864e5);
    return { sr: nyMins(toDate(Jt - w / 360)), ss: nyMins(toDate(Jt + w / 360)) };
  };
  let sun = sunTimes() || { sr: 7 * 60, ss: 18 * 60 + 30 };
  const phaseNow = () => {
    const m = minsNow(), { sr, ss } = sun;
    if (m >= sr - 45 && m <= sr + 40) return "dusk";
    if (m > sr + 40 && m < ss - 60) return "day";
    if (m >= ss - 60 && m <= ss + 45) return "dusk";
    return "night";
  };
  const tick = () => {
    if (clock) clock.textContent = tf.format(new Date()).toLowerCase();
    sun = sunTimes() || sun;
    const ph = phaseNow();
    if (ph !== sky.phase()) sky.set({ phase: ph });
  };
  tick(); setInterval(tick, 20000);
  sky.set({ phase: phaseNow() });

  // NWS text ("Light Rain and Fog/Mist", "Mostly Cloudy", ...) -> sky effects
  const fxFrom = (text) => {
    const t = (text || "").toLowerCase();
    const heavy = /heavy/.test(t), light = /light/.test(t);
    if (/thunder|t-storm/.test(t)) return { cover: 0.92, rain: 0.3, thunder: true };
    if (/snow|flurr|blizzard/.test(t)) return { cover: 0.8, snow: heavy || /blizzard/.test(t) ? 0.3 : 0.2 };
    if (/sleet|freezing|ice pellets|wintry/.test(t)) return { cover: 0.85, rain: 0.2 };
    if (/drizzle/.test(t)) return { cover: 0.8, rain: 0.1 };
    if (/rain|shower/.test(t)) return { cover: 0.85, rain: heavy ? 0.34 : light ? 0.16 : 0.24 };
    if (/fog|mist/.test(t)) return { cover: 0.6, fog: 0.5 };
    if (/haze|smoke|dust/.test(t)) return { cover: 0.35, fog: 0.25 };
    if (/overcast/.test(t)) return { cover: 0.85 };
    if (/mostly cloudy|considerable/.test(t)) return { cover: 0.7 };
    if (/partly|scattered/.test(t)) return { cover: 0.45 };
    if (/mostly clear|mostly sunny|fair|few clouds|a few/.test(t)) return { cover: 0.18 };
    if (/clear|sunny/.test(t)) return { cover: 0.05 };
    if (/cloud/.test(t)) return { cover: 0.8 };
    return { cover: 0.3 };
  };
  const NWS = "https://api.weather.gov";
  const nwsGet = async (url) => { const r = await fetch(url, { headers: { Accept: "application/geo+json" } }); if (!r.ok) throw new Error(String(r.status)); return r.json(); };
  let nwsInfo = null;
  const getInfo = async () => {
    if (nwsInfo) return nwsInfo;
    const c = store.get("nws:info");
    if (c) { try { nwsInfo = JSON.parse(c); if (nwsInfo.st && nwsInfo.st.length) return nwsInfo; } catch { /* refetch */ } }
    const pt = (await nwsGet(`${NWS}/points/${LAT},${LON}`)).properties;
    const list = await nwsGet(pt.observationStations);
    nwsInfo = { st: list.features.slice(0, 4).map((f) => f.properties.stationIdentifier), hourly: pt.forecastHourly };
    store.set("nws:info", JSON.stringify(nwsInfo));
    return nwsInfo;
  };
  // Nearest station with a fresh temperature reading wins (Flagler County Airport is usually first)
  const latestObs = async (ids) => {
    for (const id of ids) {
      try {
        const pr = (await nwsGet(`${NWS}/stations/${id}/observations/latest`)).properties;
        const c = pr.temperature && pr.temperature.value;
        if (c != null && Date.now() - new Date(pr.timestamp).getTime() < 3 * 3600e3) return { f: c * 9 / 5 + 32, text: pr.textDescription || "" };
      } catch { /* try the next station */ }
    }
    return null;
  };
  const hourlyNow = async (url) => {
    const p = (await nwsGet(url)).properties.periods[0];
    return { f: p.temperatureUnit === "C" ? p.temperature * 9 / 5 + 32 : p.temperature, text: p.shortForecast || "" };
  };
  let lastWx = 0, wxBusy = false;
  const loadWeather = async () => {
    if (wxBusy) return;
    wxBusy = true;
    try {
      const info = await getInfo();
      const cur = (await latestObs(info.st)) || (await hourlyNow(info.hourly));
      const desc = cur.text.toLowerCase();
      if (wx) {
        wx.textContent = `${Math.round(cur.f)}°F${desc ? ", " + desc : ""}`;
        wx.title = "Current conditions from the National Weather Service";
        wx.hidden = false; if (wxDot) wxDot.hidden = false;
      }
      sky.set({ phase: phaseNow(), cover: 0.2, rain: 0, snow: 0, fog: 0, thunder: false, ...fxFrom(cur.text) });
      lastWx = Date.now();
    } catch {
      // offline, blocked or rate limited: keep what we have (or the time-of-day sky) and retry soon
      if (!lastWx) setTimeout(loadWeather, 60000);
    } finally { wxBusy = false; }
  };
  loadWeather();
  setInterval(() => { if (!document.hidden) loadWeather(); }, 15 * 60 * 1000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden && Date.now() - lastWx > 15 * 60 * 1000) loadWeather(); });

  /* ───────── GitHub numbers: static snapshot first, live refresh second ───────── */
  const fmt = (n) => Number(n).toLocaleString("en-US");
  const gh = { followers: null, repos: null, contrib: null, repo: {} };
  const paintGh = () => {
    $$("[data-gh]").forEach((el) => {
      const [k, name] = el.dataset.gh.split(":");
      const v = (k === "stars" || k === "forks") ? (gh.repo[name] && gh.repo[name][k]) : gh[k];
      if (v != null) el.textContent = fmt(v);
    });
  };
  const heatG = $("#heat-g"), heatM = $("#heat-m");
  const renderHeat = (start, days) => {
    if (!heatG || !days || !days.length) return;
    heatG.replaceChildren(); heatM.replaceChildren();
    const lvl = (c) => (c <= 0 ? 0 : c <= 2 ? 1 : c <= 5 ? 2 : c <= 11 ? 3 : 4);
    const d0 = new Date(`${start}T00:00:00Z`), offset = d0.getUTCDay();
    const frag = document.createDocumentFragment();
    for (let i = 0; i < offset; i++) { const e = document.createElement("i"); e.style.visibility = "hidden"; frag.append(e); }
    let lastMonth = -1;
    days.forEach((c, i) => {
      const date = new Date(d0.getTime() + i * 864e5);
      const col = Math.floor((i + offset) / 7);
      const cell = document.createElement("i");
      const l = lvl(c); if (l) cell.className = `l${l}`;
      cell.style.setProperty("--w", col);
      cell.title = `${c} contribution${c === 1 ? "" : "s"} on ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}`;
      frag.append(cell);
      if ((i + offset) % 7 === 0 || i === 0) {
        const m = date.getUTCMonth();
        if (m !== lastMonth && (col === 0 ? date.getUTCDate() < 20 : true)) {
          lastMonth = m;
          const s = document.createElement("span");
          s.textContent = date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
          s.style.left = `${col * 12}px`; heatM.append(s);
        }
      }
    });
    heatG.append(frag);
    heatM.style.width = `${Math.ceil((days.length + offset) / 7) * 12}px`;
    const sc = heatG.parentElement; requestAnimationFrame(() => { sc.scrollLeft = sc.scrollWidth; });
  };
  const setContrib = (total, start, days, note) => {
    gh.contrib = total; paintGh();
    const t = $("#act-total"); if (t) t.textContent = `${fmt(total)} contributions in the last year`;
    const n = $("#heat-note"); if (n) n.textContent = note;
    renderHeat(start, days);
  };
  const getJSON = async (url, key, ttl = 900000) => {
    const c = store.get(key);
    if (c) { try { const o = JSON.parse(c); if (Date.now() - o.t < ttl) return o.d; } catch { /* ignore */ } }
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (!r.ok) throw new Error(String(r.status));
    const d = await r.json(); store.set(key, JSON.stringify({ t: Date.now(), d })); return d;
  };
  (async () => {
    try {
      const snap = await (await fetch("data/github.json", { cache: "no-cache" })).json();
      gh.followers = snap.followers; gh.repos = snap.public_repos;
      Object.entries(snap.repos).forEach(([n, r]) => { gh.repo[n] = r; });
      setContrib(snap.contrib.total, snap.contrib.start, snap.contrib.days, `Public contributions on GitHub. Snapshot from ${new Date(snap.generated + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}.`);
    } catch { /* keep static HTML */ }
    try {
      const [u, repos] = await Promise.all([
        getJSON("https://api.github.com/users/isaiahagi", "gh:user"),
        getJSON("https://api.github.com/users/isaiahagi/repos?per_page=100&sort=pushed", "gh:repos"),
      ]);
      gh.followers = u.followers; gh.repos = u.public_repos;
      repos.forEach((r) => { gh.repo[r.name] = { stars: r.stargazers_count, forks: r.forks_count }; });
      paintGh();
    } catch { /* offline or rate limited */ }
    try {
      const c = await getJSON("https://github-contributions-api.jogruber.de/v4/isaiahagi?y=last", "gh:contrib", 3600000);
      const list = (c.contributions || []).filter((d) => d.date);
      if (list.length > 300) setContrib((c.total && c.total.lastYear) || list.reduce((s, d) => s + d.count, 0), list[0].date, list.map((d) => d.count), "Public contributions on GitHub. Live.");
    } catch { /* keep snapshot */ }
  })();

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
    const input = $("#q-bits"), out = $("#q-out");
    const W = 640, H = 220, mid = H / 2, bw = W / N, sc = (H / 2 - 14) / maxAbs;
    const NS = "http://www.w3.org/2000/svg";
    const el = (n, a) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
    qSvg.append(el("line", { x1: 0, x2: W, y1: mid, y2: mid, stroke: "currentColor", "stroke-opacity": ".25", "stroke-width": 1, "vector-effect": "non-scaling-stroke" }));
    const bars = [], dots = [];
    for (let i = 0; i < N; i++) {
      const b = el("rect", { x: i * bw + 1, width: Math.max(bw - 2, 1), rx: 1.5, fill: "#e07a3d", "fill-opacity": ".85" });
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
