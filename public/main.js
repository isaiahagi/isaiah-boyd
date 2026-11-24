/* Page behaviour: clock, reveal, scroll spy, counters, GitHub stats, copy buttons,
   background combobox, pull-to-refresh, project ASCII strips. No dependencies. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var toastEl = $("#toast");
  function say(msg) { if (toastEl) { toastEl.textContent = ""; setTimeout(function () { toastEl.textContent = msg; }, 30); } }

  /* ---------- footer year ---------- */
  var yr = $("#year"); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- clock (Virginia = America/New_York) ---------- */
  var clock = $("#clock");
  if (clock) {
    var fmt;
    try { fmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit", hour12: true }); } catch (e) { fmt = null; }
    var tickClock = function () {
      if (!fmt) { clock.textContent = ""; return; }
      var d = new Date();
      clock.textContent = fmt.format(d).toLowerCase();
      clock.setAttribute("datetime", d.toISOString());
    };
    tickClock(); setInterval(tickClock, 10000);
  }

  /* ---------- reveal + counters ---------- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count")), suffix = el.getAttribute("data-suffix") || "";
    if (isNaN(target) || reduce) return;
    var t0 = performance.now(), dur = 1300;
    var run = function (now) {
      var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e).toLocaleString("en-US") + (p < 1 ? "" : suffix);
      if (p < 1) requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
  }
  var revealEls = $$("[data-reveal]");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        $$("[data-count]", en.target).forEach(countUp);
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 60 + "ms"; io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- scroll spy ---------- */
  var links = $$(".nav__links a");
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.setAttribute("aria-current", a.getAttribute("href") === "#" + en.target.id ? "true" : "false"); });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    ["about", "work", "stack", "connect"].forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* ---------- GitHub numbers (public API, falls back to the snapshot) ---------- */
  function setGh(key, val) { $$('[data-gh="' + key + '"]').forEach(function (el) { el.textContent = Number(val).toLocaleString("en-US"); }); }
  function applyGh(j) { if (j && typeof j.public_repos === "number") setGh("repos", j.public_repos); if (j && typeof j.followers === "number") setGh("followers", j.followers); }
  var ctl = ("AbortController" in window) ? new AbortController() : null;
  var to = setTimeout(function () { if (ctl) ctl.abort(); }, 6000);
  fetch("https://api.github.com/users/isaiahagi", { headers: { Accept: "application/vnd.github+json" }, signal: ctl ? ctl.signal : undefined })
    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(applyGh)
    .catch(function () { return fetch("data/github.json").then(function (r) { return r.json(); }).then(applyGh); })
    .catch(function () {})
    .then(function () { clearTimeout(to); });

  /* ---------- copy ("saved") buttons ---------- */
  function legacyCopy(text) {
    return new Promise(function (res, rej) {
      var ta = document.createElement("textarea"); ta.value = text; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;opacity:0;top:0";
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      ta.remove();
      ok ? res() : rej(new Error("copy failed"));
    });
  }
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
    }
    return legacyCopy(text);
  }
  $$("[data-copy]").forEach(function (btn) {
    var lbl = $(".save__l", btn), timer;
    btn.addEventListener("click", function () {
      var val = btn.getAttribute("data-copy");
      copyText(val).then(function () {
        btn.classList.add("is-saved"); if (lbl) lbl.textContent = "Copied";
        say("Copied " + val);
        clearTimeout(timer);
        timer = setTimeout(function () { btn.classList.remove("is-saved"); if (lbl) lbl.textContent = "Copy"; }, 1800);
      }).catch(function () { say("Could not copy. Select the text manually."); });
    });
  });

  /* ---------- background combobox ---------- */
  var btn = $("#combo-btn"), list = $("#combo-list"), val = $("#combo-val");
  var opts = list ? $$('[role="option"]', list) : [];
  var activeIdx = 0;
  function setActive(i) {
    activeIdx = (i + opts.length) % opts.length;
    opts.forEach(function (o, k) { o.setAttribute("data-active", k === activeIdx ? "true" : "false"); });
    btn.setAttribute("aria-activedescendant", opts[activeIdx].id);
    opts[activeIdx].scrollIntoView({ block: "nearest" });
  }
  function openList() { list.hidden = false; btn.setAttribute("aria-expanded", "true"); var sel = opts.findIndex(function (o) { return o.getAttribute("aria-selected") === "true"; }); setActive(sel < 0 ? 0 : sel); }
  function closeList() { list.hidden = true; btn.setAttribute("aria-expanded", "false"); btn.removeAttribute("aria-activedescendant"); }
  function choose(i) {
    var o = opts[i]; if (!o) return;
    opts.forEach(function (x) { x.setAttribute("aria-selected", x === o ? "true" : "false"); });
    val.textContent = o.textContent;
    try { localStorage.setItem("bg-scene", o.getAttribute("data-v")); } catch (e) {}
    if (window.AsciiBG) window.AsciiBG.setScene(o.getAttribute("data-v"));
    say("Background: " + o.textContent);
    closeList();
  }
  if (btn && list) {
    btn.addEventListener("click", function () { list.hidden ? openList() : closeList(); });
    btn.addEventListener("keydown", function (e) {
      var isOpen = !list.hidden;
      switch (e.key) {
        case "ArrowDown": e.preventDefault(); isOpen ? setActive(activeIdx + 1) : openList(); break;
        case "ArrowUp": e.preventDefault(); isOpen ? setActive(activeIdx - 1) : openList(); break;
        case "Home": if (isOpen) { e.preventDefault(); setActive(0); } break;
        case "End": if (isOpen) { e.preventDefault(); setActive(opts.length - 1); } break;
        case "Enter": case " ": if (isOpen) { e.preventDefault(); choose(activeIdx); } break;
        case "Escape": if (isOpen) { e.preventDefault(); closeList(); } break;
        case "Tab": if (isOpen) closeList(); break;
      }
    });
    opts.forEach(function (o, i) {
      o.addEventListener("click", function () { choose(i); btn.focus(); });
      o.addEventListener("pointermove", function () { if (activeIdx !== i) setActive(i); });
    });
    document.addEventListener("pointerdown", function (e) { if (!list.hidden && !$("#combo").contains(e.target)) closeList(); });

    // restore the last scene
    var saved = null; try { saved = localStorage.getItem("bg-scene"); } catch (e) {}
    var si = opts.findIndex(function (o) { return o.getAttribute("data-v") === saved; });
    if (si > 0) {
      opts.forEach(function (x, k) { x.setAttribute("aria-selected", k === si ? "true" : "false"); });
      val.textContent = opts[si].textContent;
      var tryScene = function () { if (window.AsciiBG) window.AsciiBG.setScene(opts[si].getAttribute("data-v")); else setTimeout(tryScene, 60); };
      tryScene();
    }
  }

  /* ---------- re-roll (button + pull-to-refresh) ---------- */
  function reroll() {
    if (window.AsciiBG) window.AsciiBG.reroll();
    if (window.Hero) window.Hero.scramble();
    say("Background re-rolled");
  }
  var rr = $("#reroll");
  if (rr) rr.addEventListener("click", function () {
    rr.classList.remove("spin"); void rr.offsetWidth; rr.classList.add("spin"); reroll();
    setTimeout(function () { rr.classList.remove("spin"); }, 600);
  });

  var ptr = $("#ptr");
  if (ptr && "ontouchstart" in window) {
    var startY = 0, pull = 0, active = false, busy = false, label = $("span", ptr), TH = 72;
    var paint = function (p) {
      ptr.style.opacity = Math.min(1, p / 40);
      ptr.style.transform = "translate(-50%, " + (p - 56 + 14) + "px)";
      var ready = p >= TH; ptr.classList.toggle("ready", ready);
      label.textContent = ready ? "Release to re-roll" : "Pull to re-roll";
      ptr.querySelector(".ic").style.transform = "rotate(" + Math.min(360, p * 5) + "deg)";
    };
    window.addEventListener("touchstart", function (e) { if (window.scrollY <= 0 && !busy) { startY = e.touches[0].clientY; active = true; } }, { passive: true });
    window.addEventListener("touchmove", function (e) {
      if (!active || busy) return;
      var dy = e.touches[0].clientY - startY;
      if (dy <= 0 || window.scrollY > 0) { pull = 0; paint(0); return; }
      pull = Math.min(110, dy * 0.5); paint(pull);
    }, { passive: true });
    var end = function () {
      if (!active) return; active = false;
      if (pull >= TH) {
        busy = true; ptr.classList.add("busy"); label.textContent = "Re-rolling"; ptr.style.transform = "translate(-50%, 18px)"; reroll();
        setTimeout(function () { busy = false; ptr.classList.remove("busy", "ready"); ptr.style.opacity = 0; ptr.style.transform = "translate(-50%, -80px)"; }, 900);
      } else { ptr.style.opacity = 0; ptr.style.transform = "translate(-50%, -80px)"; }
      pull = 0;
    };
    window.addEventListener("touchend", end, { passive: true });
    window.addEventListener("touchcancel", end, { passive: true });
  }

  /* ---------- project ASCII strips ---------- */
  var SR = " .:-=+*#%@";
  function seedOf(str) { var h = 1779033703 ^ str.length; for (var i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); } return h >>> 0; }
  function rng(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function strip(el) {
    var r = rng(seedOf(el.getAttribute("data-ascii")));
    var W = 64, Hh = 3, f = [], k;
    for (k = 0; k < 4; k++) f.push({ a: 0.4 + r() * 0.6, w: 0.08 + r() * 0.3, p: r() * 6.28, s: (r() - 0.5) * 0.9 });
    var phase = 0, timer = null;
    var draw = function () {
      var out = "";
      for (var y = 0; y < Hh; y++) {
        for (var x = 0; x < W; x++) {
          var v = 0;
          for (var i = 0; i < f.length; i++) v += f[i].a * Math.sin(x * f[i].w + f[i].p + phase * f[i].s * 4 + y * 0.9);
          v = v / 2.6 * 0.5 + 0.5;
          v *= 0.35 + 0.65 * Math.min(1, Math.min(x, W - 1 - x) / 10);       // fade the strip ends
          out += SR[Math.max(0, Math.min(SR.length - 1, (v * (SR.length - 1) + 0.5) | 0))];
        }
        out += y < Hh - 1 ? "\n" : "";
      }
      el.textContent = out;
    };
    draw();
    if (reduce) return;
    var card = el.closest(".proj") || el;
    var go = function () { if (timer) return; timer = setInterval(function () { phase += 0.07; draw(); }, 70); };
    var halt = function () { clearInterval(timer); timer = null; };
    card.addEventListener("pointerenter", go); card.addEventListener("pointerleave", halt);
    card.addEventListener("focusin", go); card.addEventListener("focusout", halt);
  }
  $$("[data-ascii]").forEach(strip);
})();
