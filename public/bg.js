/* ASCII background: a fixed canvas that paints a glyph field.
   Scenes: waves (ocean + moon), noise (plasma), rain, off.
   Glyphs are pre-rendered into an atlas once, then blitted per cell (fast, crisp).
   Pauses when the tab is hidden; renders a single still frame under prefers-reduced-motion. */
(function () {
  "use strict";

  var canvas = document.getElementById("bg");
  if (!canvas) return;
  var ctx = canvas.getContext("2d", { alpha: true });
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  var RAMP = " .,:;~-=+*#%@";            // brightness ramp, index 0 is empty
  var N = RAMP.length;
  var FPS = 30;

  var state = {
    scene: "waves", seed: Math.random() * 1000, burst: 0,
    dpr: 1, cw: 10, ch: 18, cols: 0, rows: 0, atlas: null,
    px: -1, py: -1, pv: 0,                 // pointer in cell units, pointer energy
    t: 0, last: 0, raf: 0, scroll: 0, scrollV: 0, running: false
  };

  /* ---- helpers ---- */
  function hash(x, y) {
    var h = Math.sin(x * 127.1 + y * 311.7 + state.seed) * 43758.5453;
    return h - Math.floor(h);
  }
  function smooth(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

  /* ---- atlas ---- */
  function buildAtlas() {
    var w = Math.round(state.cw * state.dpr), h = Math.round(state.ch * state.dpr);
    var a = document.createElement("canvas");
    a.width = w * N; a.height = h * 2;
    var c = a.getContext("2d");
    c.textBaseline = "middle"; c.textAlign = "center";
    c.font = "500 " + Math.round(state.ch * 0.8 * state.dpr) + "px 'JetBrains Mono', ui-monospace, Consolas, monospace";
    for (var row = 0; row < 2; row++) {
      c.fillStyle = row === 0 ? "#ece9e2" : "#ff6b35";
      for (var i = 1; i < N; i++) c.fillText(RAMP[i], i * w + w / 2, row * h + h / 2 + 1);
    }
    state.atlas = a; state.aw = w; state.ah = h;
  }

  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    var small = w < 720;
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.cw = small ? 9 : 10;
    state.ch = small ? 16 : 18;
    canvas.width = Math.round(w * state.dpr);
    canvas.height = Math.round(h * state.dpr);
    state.cols = Math.ceil(w / state.cw);
    state.rows = Math.ceil(h / state.ch);
    buildAtlas();
    drawFrame(true);
  }

  /* ---- scenes: return brightness 0..1 for a cell ---- */
  var rainCols = [];
  function initRain() {
    rainCols = [];
    for (var i = 0; i < state.cols; i++) {
      rainCols.push({ off: Math.random() * 1000, spd: 4 + Math.random() * 9, len: 6 + Math.random() * 16, on: Math.random() < 0.55 });
    }
  }

  function sceneWaves(cx, cy, t) {
    var W = state.cols, H = state.rows, hy = H * 0.52;
    var u = cx / W;
    // moon / sun disc sitting on the horizon
    var mx = W * (0.74 + 0.18 * Math.sin(state.seed)), my = hy - H * 0.27, mr = Math.min(W * 0.07, H * 0.19);
    var dx = (cx - mx) * 0.55, dy = (cy - my);
    var d = Math.sqrt(dx * dx + dy * dy);
    var v = 0;
    if (cy < hy) {
      // sky: sparse twinkling stars + disc with glow
      var s = hash(cx, cy);
      if (s > 0.992) v = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * 2 + s * 90));
      if (d < mr) v = Math.max(v, 0.5 + 0.2 * smooth(mr, mr * 0.2, d));
      else v = Math.max(v, 0.3 * Math.exp(-(d - mr) * 0.22));
      // faint haze toward the horizon
      v = Math.max(v, 0.12 * smooth(hy - H * 0.1, hy, cy) * (0.6 + 0.4 * Math.sin(cx * 0.35 + t * 0.4)));
    } else {
      var yy = (cy - hy) / (H - hy);                // 0 at horizon, 1 at bottom
      var depth = 1 / (yy + 0.07);
      var xx = (u - 0.5) * depth;
      var band = Math.sin(depth * 3.4 - t * 1.2 + Math.sin(xx * 4 + t * 0.45 + state.seed) * 0.8);
      var chop = Math.sin(xx * 11 + t * 0.8 + depth * 1.6) * 0.5;
      v = Math.pow(0.5 + 0.5 * (band * 0.8 + chop * 0.2), 3.2) * (0.25 + 0.75 * Math.pow(yy, 0.7));
      // reflection of the disc: vertical glitter streak
      var rx = Math.abs(cx - mx) / (mr * 1.1 + yy * 6);
      v += 0.55 * Math.exp(-rx * rx * 2.2) * (0.5 + 0.5 * Math.sin(depth * 9 - t * 3)) * (1 - yy * 0.55);
      v *= smooth(0, 0.05, yy);
    }
    return v;
  }

  function sceneNoise(cx, cy, t) {
    var u = cx * 0.045, v = cy * 0.07;
    var a = Math.sin(u + t * 0.35 + state.seed) + Math.sin(v * 1.3 - t * 0.28) + Math.sin((u + v) * 0.8 + t * 0.2);
    a += Math.sin(Math.sqrt((cx - state.cols * 0.5) * (cx - state.cols * 0.5) * 0.3 + (cy - state.rows * 0.5) * (cy - state.rows * 0.5)) * 0.22 - t * 0.7) * 1.2;
    var x = (a / 4.2) * 0.5 + 0.5;
    return Math.pow(Math.max(0, x), 2.4);
  }

  function sceneRain(cx, cy, t) {
    var c = rainCols[cx];
    if (!c || !c.on) return 0;
    var span = state.rows + c.len * 2;
    var head = ((t * c.spd + c.off) % span) - c.len;
    var dist = head - cy;
    if (dist < 0 || dist > c.len) return 0;
    var v = 1 - dist / c.len;
    if (dist < 0.8) return 1;
    return v * v * (0.55 + 0.45 * hash(cx, cy + Math.floor(t * 8)));
  }

  /* ---- frame ---- */
  function drawFrame(still) {
    if (state.scene === "off") { ctx.clearRect(0, 0, canvas.width, canvas.height); return; }
    var fn = state.scene === "noise" ? sceneNoise : state.scene === "rain" ? sceneRain : sceneWaves;
    var cols = state.cols, rows = state.rows, aw = state.aw, ah = state.ah;
    var t = state.t + state.scroll * 0.0025;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var px = state.px, py = state.py, pe = state.pv, burst = state.burst;
    var atlas = state.atlas;
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var v = fn(x, y, t);
        var warm = 0;
        if (pe > 0.01 && state.scene !== "rain") {
          var dx = (x - px) * 0.55, dy = y - py, d2 = dx * dx + dy * dy;
          if (d2 < 260) {
            var d = Math.sqrt(d2);
            var ring = Math.sin(d * 1.15 - t * 7) * Math.exp(-d2 / 110) * pe;
            v += ring * 0.55;
            if (d2 < 60) warm = 1;
          }
        }
        if (burst > 0.01) v += (hash(x * 1.7, y * 2.3 + Math.floor(t * 20)) - 0.35) * burst;
        if (v <= 0) continue;
        var i = (v * (N - 1) + 0.5) | 0;
        if (i < 1) continue;
        if (i > N - 1) i = N - 1;
        ctx.drawImage(atlas, i * aw, warm ? ah : 0, aw, ah, x * aw, y * ah, aw, ah);
      }
    }
  }

  function loop(now) {
    state.raf = requestAnimationFrame(loop);
    var dt = now - state.last;
    if (dt < 1000 / FPS) return;
    state.last = now;
    state.t += Math.min(dt, 100) / 1000;
    state.pv *= 0.94;
    state.burst *= 0.9;
    state.scrollV *= 0.9;
    drawFrame(false);
  }

  function start() {
    if (state.running || reduce.matches || state.scene === "off") { drawFrame(true); return; }
    state.running = true; state.last = performance.now();
    state.raf = requestAnimationFrame(loop);
  }
  function stop() { state.running = false; cancelAnimationFrame(state.raf); }

  /* ---- public API ---- */
  var api = {
    setScene: function (name) {
      state.scene = name;
      if (name === "rain") initRain();
      stop();
      if (name === "off") { drawFrame(true); return; }
      api.reroll(true);
      start();
    },
    reroll: function (quiet) {
      state.seed = Math.random() * 1000;
      state.t = Math.random() * 50;
      state.burst = quiet ? 0.35 : 1;
      if (state.scene === "rain") initRain();
      if (reduce.matches || state.scene === "off") drawFrame(true);
    },
    pulse: function (cx, cy) { state.px = cx; state.py = cy; state.pv = 1; }
  };
  window.AsciiBG = api;

  /* ---- events ---- */
  window.addEventListener("pointermove", function (e) {
    state.px = e.clientX / state.cw; state.py = e.clientY / state.ch; state.pv = Math.min(1, state.pv + 0.35);
  }, { passive: true });
  window.addEventListener("pointerdown", function (e) {
    state.px = e.clientX / state.cw; state.py = e.clientY / state.ch; state.pv = 1;
  }, { passive: true });
  window.addEventListener("scroll", function () { state.scroll = window.scrollY; }, { passive: true });

  var rt;
  window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { resize(); if (state.scene === "rain") initRain(); }, 150); });
  document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else start(); });
  reduce.addEventListener && reduce.addEventListener("change", function () { stop(); start(); });

  var ready = document.fonts && document.fonts.load ? document.fonts.load("500 14px 'JetBrains Mono'") : Promise.resolve();
  ready.catch(function () {}).then(function () { resize(); initRain(); start(); });
})();
