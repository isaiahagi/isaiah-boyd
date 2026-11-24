/* Hero: ASCII wordmark (scramble-in + pointer glitch), spinning ASCII basketball, role typewriter. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ================= wordmark ================= */
  var pre = document.getElementById("wordmark");
  var wm = null;
  if (pre) {
    var orig = pre.textContent.split("\n");
    var rows = orig.length, cols = Math.max.apply(null, orig.map(function (l) { return l.length; }));
    var cur = orig.map(function (l) { return l.split(""); });
    var heat = new Float32Array(rows * cols);
    var GL = "█▓▒░╗║╚═╝╔#%@*+/\\<>";
    var live = false, last = 0;

    var render = function () { pre.textContent = cur.map(function (r) { return r.join(""); }).join("\n"); };
    var step = function (now) {
      if (now - last < 42) { requestAnimationFrame(step); return; }
      last = now;
      var any = false;
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < orig[r].length; c++) {
          var i = r * cols + c, ch = orig[r][c];
          if (ch === " ") continue;
          if (heat[i] > 0) {
            heat[i] -= 0.1; any = true;
            cur[r][c] = heat[i] > 0 ? GL[(Math.random() * GL.length) | 0] : ch;
          }
        }
      }
      render();
      if (any) requestAnimationFrame(step); else live = false;
    };
    var kick = function () { if (!live) { live = true; requestAnimationFrame(step); } };

    wm = {
      scramble: function () {
        if (reduce) return;
        for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) heat[r * cols + c] = 0.6 + (c / cols) * 2.4 + Math.random() * 0.5;
        kick();
      },
      poke: function (clientX, clientY) {
        if (reduce) return;
        var b = pre.getBoundingClientRect();
        if (clientX < b.left - 20 || clientX > b.right + 20 || clientY < b.top - 20 || clientY > b.bottom + 20) return;
        var cx = ((clientX - b.left) / b.width) * cols, cy = ((clientY - b.top) / b.height) * rows;
        for (var r = Math.max(0, Math.floor(cy) - 2); r <= Math.min(rows - 1, Math.ceil(cy) + 2); r++) {
          for (var c = Math.max(0, Math.floor(cx) - 4); c <= Math.min(cols - 1, Math.ceil(cx) + 4); c++) {
            var dx = (c - cx) * 0.5, dy = r - cy;
            if (dx * dx + dy * dy < 9) heat[r * cols + c] = Math.max(heat[r * cols + c], 0.5 + Math.random() * 0.4);
          }
        }
        kick();
      }
    };
    window.addEventListener("pointermove", function (e) { wm.poke(e.clientX, e.clientY); }, { passive: true });
    pre.addEventListener("pointerdown", function (e) { wm.scramble(); });
    wm.scramble();
  }

  /* ================= basketball orb ================= */
  var orb = document.getElementById("orb");
  var orbApi = null;
  if (orb) {
    var C = 50, ASPECT = 1.72, R = Math.round(C / ASPECT);
    var RAMP = " .,:;-=+*#%@";
    var ang = 0.6, vel = 0.012, tilt = 0.38, dragging = false, lx = 0, lastT = 0, visible = true;
    var L = (function () { var x = -0.55, y = 0.55, z = 0.65, m = Math.sqrt(x * x + y * y + z * z); return [x / m, y / m, z / m]; })();

    var frame = function () {
      var ca = Math.cos(-ang), sa = Math.sin(-ang), ct = Math.cos(-tilt), st = Math.sin(-tilt);
      var out = "";
      for (var j = 0; j < R; j++) {
        var y = -((j + 0.5 - R / 2) / (R / 2));
        var line = "";
        for (var i = 0; i < C; i++) {
          var x = (i + 0.5 - C / 2) / (C / 2);
          var r2 = x * x + y * y;
          if (r2 > 1) { line += " "; continue; }
          var z = Math.sqrt(1 - r2);
          var lum = Math.max(0, x * L[0] + y * L[1] + z * L[2]);
          // tilt about X, then spin about Y (inverse) to get object-space point
          var y1 = y * ct - z * st, z1 = y * st + z * ct;
          var px = x * ca + z1 * sa, pz = -x * sa + z1 * ca, py = y1;
          var seam = Math.min(Math.abs(py), Math.abs(px), Math.abs(Math.abs(px) - 0.52 * (1 - py * py)) * 0.85);
          var v = 0.2 + Math.pow(lum, 0.85) * 0.8;
          if (seam < 0.05) v *= 0.1;
          else if (seam < 0.085) v *= 0.55;
          var k = (v * (RAMP.length - 1) + 0.5) | 0;
          line += RAMP[Math.min(RAMP.length - 1, Math.max(0, k))];
        }
        out += line + "\n";
      }
      orb.textContent = out;
    };

    var tick = function (now) {
      requestAnimationFrame(tick);
      if (!visible || document.hidden) return;
      if (now - lastT < 42) return;
      lastT = now;
      if (!dragging) { vel += (0.012 - vel) * 0.04; }
      ang += vel;
      frame();
    };

    orb.addEventListener("pointerdown", function (e) { dragging = true; lx = e.clientX; orb.setPointerCapture(e.pointerId); });
    orb.addEventListener("pointermove", function (e) { if (!dragging) return; vel = (e.clientX - lx) * 0.012; ang += (e.clientX - lx) * 0.012; lx = e.clientX; });
    var up = function () { dragging = false; };
    orb.addEventListener("pointerup", up); orb.addEventListener("pointercancel", up);

    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(orb);
    frame();
    if (!reduce) requestAnimationFrame(tick);
    orbApi = { frame: frame };
  }

  /* ================= roles typewriter ================= */
  var roleEl = document.getElementById("roles");
  if (roleEl && !reduce) {
    var roles = ["Software Engineer", "Game Developer", "Full Stack Developer"];
    var ri = 0, ci = roles[0].length, del = false;
    roleEl.textContent = roles[0];
    var type = function () {
      var word = roles[ri], delay = del ? 38 : 70;
      if (!del) { ci++; if (ci >= word.length) { ci = word.length; del = true; delay = 1700; } }
      else { ci--; if (ci <= 0) { ci = 0; del = false; ri = (ri + 1) % roles.length; delay = 320; } }
      roleEl.textContent = roles[ri].slice(0, ci);
      setTimeout(type, delay);
    };
    setTimeout(type, 1800);
  }

  window.Hero = { scramble: function () { if (wm) wm.scramble(); } };
})();
