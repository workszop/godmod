/* GodMod – shared site behaviour (no dependencies)
   The artefact archive: starfield, the relic's generated script, deciphering
   titles, console readouts, copy buttons, filters and navigation.

   DOM contract (read by agents/tests instead of scraping the UI):
     html[data-starfield]   "animated" | "static" | "off"
     html[data-glyphs]      number of glyph strips rendered
     [data-decipher][data-decoded]  "false" while scrambling, "true" when readable
     .relic[data-lit]       index of the currently lit ring glyph
     #progress[data-progress]  reading progress 0..100
*/
(function () {
  "use strict";

  // ─── Constants ───
  var GRID_X = [2, 8, 14];
  var GRID_Y = [3, 9, 15, 21];
  var GLYPH_W = 16;
  var GLYPH_GAP = 4;
  var WORD_GAP = 10;
  var SCRAMBLE = "◇◆○◎●△▽◁▷□■⊕⊗∴∷≡";
  var DECIPHER_MS = 1600;
  var RING_GLYPHS = 40;
  var RING_STEP_MS = 160;
  var RING_TRAIL = 5;
  var STAR_DENSITY = 1700; // px² per star
  var STAR_MAX = 900;
  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ─── State ───
  var state = {
    glyphStrips: 0,
    toastTimer: null,
    stars: [],
    starCtx: null,
    starW: 0,
    starH: 0,
    lastFrame: 0,
    loadedAt: Date.now()
  };

  // ─── DOM refs ───
  var root = document.documentElement;
  var toastEl = null;
  var progressEl = null;

  // ─── Helpers ───
  function rng(seed) {
    return function () {
      seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashSeed(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
    return h >>> 0;
  }

  function pick(rand, arr) { return arr[Math.floor(rand() * arr.length)]; }
  function clampIdx(i, n) { return Math.max(0, Math.min(n - 1, i)); }

  /* One glyph of the relic's script: a shared top bar with strokes hanging
     from it on a 3×4 grid, sometimes a dot. Returns inner SVG markup. */
  function glyphMarkup(rand) {
    var d = "M0 " + GRID_Y[0] + "H" + GLYPH_W;
    var strokes = 2 + Math.floor(rand() * 2);
    for (var s = 0; s < strokes; s++) {
      var xi = Math.floor(rand() * 3);
      var yi = s === 0 ? 0 : Math.floor(rand() * 4);
      d += "M" + GRID_X[xi] + " " + GRID_Y[yi];
      var segs = 1 + Math.floor(rand() * 2);
      for (var k = 0; k < segs; k++) {
        var nx = clampIdx(xi + pick(rand, [-1, 0, 1]), 3);
        var ny = clampIdx(yi + pick(rand, [1, 1, 2, -1]), 4);
        if (nx === xi && ny === yi) ny = clampIdx(yi + 1, 4);
        xi = nx; yi = ny;
        d += "L" + GRID_X[xi] + " " + GRID_Y[yi];
      }
    }
    var dot = rand() < 0.4
      ? '<circle cx="' + pick(rand, GRID_X) + '" cy="' + (GRID_Y[3] + 3) + '" r="1.4"/>'
      : "";
    return '<path d="' + d + '"/>' + dot;
  }

  /* A strip of glyphs grouped into "words"; deterministic per seed. */
  function glyphStrip(seed, count) {
    var rand = rng(seed);
    var x = 0, body = "", inWord = 0, wordLen = 2 + Math.floor(rand() * 4);
    for (var i = 0; i < count; i++) {
      body += '<g transform="translate(' + x + ' 0)">' + glyphMarkup(rand) + "</g>";
      x += GLYPH_W + GLYPH_GAP;
      if (++inWord >= wordLen) { x += WORD_GAP; inWord = 0; wordLen = 2 + Math.floor(rand() * 4); }
    }
    state.glyphStrips++;
    return '<svg viewBox="-1 0 ' + (x + 2) + ' 26" aria-hidden="true" focusable="false">' + body + "</svg>";
  }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html) n.innerHTML = html;
    return n;
  }

  function token(name) {
    return getComputedStyle(root).getPropertyValue(name).trim();
  }

  function toast(msg) {
    if (!toastEl) {
      toastEl = el("div");
      toastEl.id = "toast";
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("on");
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(function () { toastEl.classList.remove("on"); }, 1700);
  }

  function copyText(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)["catch"](function () {});
      }
    } catch (e) { /* clipboard unavailable (e.g. some file:// contexts) */ }
  }

  function isTyping(t) {
    return t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
  }

  // ─── Render: starfield ───
  function makeStars() {
    var n = Math.min(STAR_MAX, Math.round((state.starW * state.starH) / STAR_DENSITY));
    var tints = [token("--star"), token("--star"), token("--star"), token("--glow"), token("--signal")];
    var rand = rng(7);
    state.stars = [];
    for (var i = 0; i < n; i++) {
      var z = 0.2 + rand() * 0.8;
      state.stars.push({
        x: rand() * state.starW,
        y: rand() * state.starH,
        z: z,
        r: z * (rand() < 0.07 ? 1.9 : 1.2),
        c: rand() < 0.88 ? tints[0] : pick(rand, tints),
        p: rand() * Math.PI * 2,
        s: 0.4 + rand() * 1.6
      });
    }
  }

  function sizeStars(canvas) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.starW = window.innerWidth;
    state.starH = window.innerHeight;
    canvas.width = Math.round(state.starW * dpr);
    canvas.height = Math.round(state.starH * dpr);
    state.starCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    makeStars();
  }

  function drawStars(t, dt) {
    var ctx = state.starCtx, w = state.starW, h = state.starH;
    var scroll = window.scrollY || 0;
    ctx.clearRect(0, 0, w, h);
    for (var i = 0; i < state.stars.length; i++) {
      var st = state.stars[i];
      if (dt) {
        st.x -= st.z * 0.012 * dt;
        if (st.x < -2) st.x += w + 4;
      }
      var y = (st.y - scroll * st.z * 0.12) % h;
      if (y < 0) y += h;
      var a = REDUCED ? 0.75 : 0.45 + 0.55 * Math.abs(Math.sin(t * 0.0006 * st.s + st.p));
      ctx.globalAlpha = a * (0.5 + st.z * 0.5);
      ctx.fillStyle = st.c;
      ctx.beginPath();
      ctx.arc(st.x, y, st.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function starLoop(t) {
    var dt = state.lastFrame ? Math.min(64, t - state.lastFrame) : 0;
    state.lastFrame = t;
    drawStars(t, dt);
    requestAnimationFrame(starLoop);
  }

  function initStars() {
    var canvas = document.createElement("canvas");
    if (!canvas.getContext) { root.dataset.starfield = "off"; return; }
    canvas.id = "stars";
    canvas.setAttribute("aria-hidden", "true");
    state.starCtx = canvas.getContext("2d");
    document.body.insertBefore(canvas, document.body.firstChild);
    sizeStars(canvas);
    root.classList.add("has-stars");
    window.addEventListener("resize", function () { sizeStars(canvas); if (REDUCED) drawStars(0, 0); });
    if (REDUCED) {
      root.dataset.starfield = "static";
      drawStars(0, 0);
      window.addEventListener("scroll", function () { drawStars(0, 0); }, { passive: true });
    } else {
      root.dataset.starfield = "animated";
      requestAnimationFrame(starLoop);
    }
  }

  // ─── Render: glyphs, consoles, footer ───
  function renderGlyphs() {
    document.querySelectorAll("[data-glyphs]").forEach(function (node, i) {
      var count = parseInt(node.getAttribute("data-glyphs"), 10) || 8;
      var seed = node.getAttribute("data-seed") || (node.textContent + i);
      node.classList.add("glyphs");
      node.setAttribute("aria-hidden", "true");
      node.innerHTML = glyphStrip(hashSeed(String(seed)), count);
    });
  }

  function renderConsoles() {
    document.querySelectorAll(".code").forEach(function (block, i) {
      if (block.querySelector(".bar")) return;
      var pre = block.querySelector("pre");
      var lines = pre ? pre.textContent.replace(/\n+$/, "").split("\n").length : 0;
      var label = block.getAttribute("data-label") || ("Console readout · " + lines + " lines");
      var bar = el("div", "bar");
      bar.appendChild(el("span", "dot"));
      var txt = el("span");
      txt.textContent = label;
      bar.appendChild(txt);
      var g = el("span", "glyphs faint", glyphStrip(hashSeed("console" + i), 6));
      g.setAttribute("aria-hidden", "true");
      bar.appendChild(g);
      block.insertBefore(bar, block.firstChild);
    });
  }

  function renderFooter() {
    var wrap = document.querySelector(".foot .wrap");
    if (!wrap || wrap.querySelector(".transmission")) return;
    var line = el("div", "transmission");
    var span = el("span");
    span.textContent = "End of transmission";
    line.appendChild(span);
    var g = el("div", "glyphs", glyphStrip(hashSeed("end-of-transmission"), 40));
    g.setAttribute("aria-hidden", "true");
    line.appendChild(g);
    wrap.insertBefore(line, wrap.firstChild);
  }

  function renderProgress() {
    progressEl = el("div");
    progressEl.id = "progress";
    progressEl.setAttribute("aria-hidden", "true");
    document.body.appendChild(progressEl);
    updateProgress();
  }

  function updateProgress() {
    if (!progressEl) return;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var pct = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
    progressEl.style.width = pct + "%";
    progressEl.dataset.progress = String(Math.round(pct));
  }

  // ─── Render: the relic (home hero) ───
  function renderRelic() {
    var relic = document.querySelector(".relic");
    if (!relic) return;
    var rand = rng(hashSeed("relic"));
    var size = 400, c = size / 2, R = 182, scale = 0.72;
    var parts = [
      '<circle class="orbit" cx="200" cy="200" r="198"/>',
      '<circle class="orbit dash" cx="200" cy="200" r="166"/>'
    ];
    for (var i = 0; i < RING_GLYPHS; i++) {
      var a = (360 / RING_GLYPHS) * i;
      parts.push('<g class="g" transform="rotate(' + a + " " + c + " " + c + ") translate(" +
        (c - (GLYPH_W * scale) / 2) + " " + (c - R - 13 * scale) + ") scale(" + scale + ')">' +
        glyphMarkup(rand) + "</g>");
    }
    var svg = '<svg class="ring" viewBox="0 0 ' + size + " " + size + '" aria-hidden="true" focusable="false">' + parts.join("") + "</svg>";
    relic.insertAdjacentHTML("afterbegin", svg);
    state.glyphStrips++;

    var gs = relic.querySelectorAll(".ring .g");
    if (REDUCED) {
      [0, 10, 20, 30].forEach(function (k) { gs[k].classList.add("lit"); });
      relic.dataset.lit = "0";
      return;
    }
    var idx = 0;
    setInterval(function () {
      if (document.hidden) return;
      gs[idx].classList.add("lit");
      gs[(idx - RING_TRAIL + RING_GLYPHS) % RING_GLYPHS].classList.remove("lit");
      relic.dataset.lit = String(idx);
      idx = (idx + 1) % RING_GLYPHS;
    }, RING_STEP_MS);
  }

  function renderUptime() {
    var out = document.querySelector("[data-uptime]");
    if (!out) return;
    function pad(n) { return (n < 10 ? "0" : "") + n; }
    function tick() {
      var s = Math.floor((Date.now() - state.loadedAt) / 1000);
      out.textContent = "T+" + pad(Math.floor(s / 3600)) + ":" + pad(Math.floor(s / 60) % 60) + ":" + pad(s % 60);
    }
    tick();
    setInterval(tick, 1000);
  }

  // ─── Render: decipher (scrambled glyphs resolve into English) ───
  function decipher(node) {
    var walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null);
    var texts = [], n;
    while ((n = walker.nextNode())) if (n.nodeValue.trim()) texts.push({ node: n, text: n.nodeValue });
    if (!texts.length) return;
    node.setAttribute("aria-label", node.textContent.replace(/\s+/g, " ").trim());
    node.dataset.decoded = "false";
    if (REDUCED) { node.dataset.decoded = "true"; return; }

    var rand = rng(hashSeed(node.textContent));
    var total = 0;
    texts.forEach(function (t) {
      t.at = [];
      for (var i = 0; i < t.text.length; i++) {
        t.at.push(((total + i) / Math.max(1, node.textContent.length)) * DECIPHER_MS * 0.75 + rand() * DECIPHER_MS * 0.25);
      }
      total += t.text.length;
    });
    var start = performance.now();
    function frame(now) {
      var el2 = now - start, done = true;
      texts.forEach(function (t) {
        var out = "";
        for (var i = 0; i < t.text.length; i++) {
          var ch = t.text[i];
          if (ch === " " || el2 >= t.at[i]) out += ch;
          else { out += SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)]; done = false; }
        }
        t.node.nodeValue = out;
      });
      if (done) node.dataset.decoded = "true";
      else requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // ─── Render: scroll reveal ───
  function initReveal() {
    if (REDUCED || !("IntersectionObserver" in window)) return;
    var targets = document.querySelectorAll("main .section, main .feature, .read figure, .read .code, .gal .gc, figure.plate");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var t = en.target;
        t.classList.add("in");
        io.unobserve(t);
        setTimeout(function () {
          t.classList.remove("reveal", "in");
          t.style.transitionDelay = "";
        }, 1100);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    targets.forEach(function (t) {
      var r = t.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.92) return; // already on screen: leave it be
      if (t.classList.contains("gc")) {
        var idx = Array.prototype.indexOf.call(t.parentNode.children, t);
        t.style.transitionDelay = (idx % 4) * 80 + "ms";
      }
      t.classList.add("reveal");
      io.observe(t);
    });
  }

  // ─── Render: "on this page" highlighting ───
  function initToc() {
    var tocLinks = Array.prototype.slice.call(document.querySelectorAll(".toc a[href^='#']"));
    if (!tocLinks.length || !("IntersectionObserver" in window)) return;
    var map = {};
    tocLinks.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      if (document.getElementById(id)) map[id] = a;
    });
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var a = map[en.target.id];
        if (!a || !en.isIntersecting) return;
        tocLinks.forEach(function (x) { x.classList.remove("on"); });
        a.classList.add("on");
      });
    }, { rootMargin: "-80px 0px -70% 0px", threshold: 0 });
    Object.keys(map).forEach(function (id) { obs.observe(document.getElementById(id)); });
  }

  // ─── Listeners ───
  document.addEventListener("click", function (ev) {
    var btn = ev.target.closest("[data-copy]");
    if (btn) {
      var snippet = btn.getAttribute("data-copy");
      copyText(snippet);
      toast("$ " + snippet);
      return;
    }

    var cb = ev.target.closest(".code .copy");
    if (cb) {
      var pre = cb.parentElement.querySelector("pre");
      var text = pre ? pre.innerText : "";
      copyText(text);
      toast("Copied " + text.split("\n").length + " lines to clipboard");
      var old = cb.textContent;
      cb.textContent = "copied ✓";
      setTimeout(function () { cb.textContent = old; }, 1200);
      return;
    }

    var toggle = ev.target.closest(".nav .toggle");
    if (toggle) {
      var links = document.querySelector(".nav .links");
      if (links) {
        var open = links.classList.toggle("open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      }
      return;
    }

    var sToggle = ev.target.closest(".sidebar .s-toggle");
    if (sToggle) {
      var side = sToggle.closest(".sidebar");
      if (side) {
        var sOpen = side.classList.toggle("open");
        sToggle.setAttribute("aria-expanded", sOpen ? "true" : "false");
      }
    }
  });

  document.addEventListener("input", function (ev) {
    var input = ev.target.closest("[data-filter]");
    if (!input) return;
    var scope = input.closest(".sidebar") || document;
    var q = input.value.trim().toLowerCase();
    scope.querySelectorAll("a[data-name]").forEach(function (a) {
      var hit = !q || a.getAttribute("data-name").toLowerCase().indexOf(q) !== -1;
      a.style.display = hit ? "" : "none";
    });
  });

  /* keyboard: "/" focuses the archive filter, Esc closes the menu / leaves the filter */
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "/" && !isTyping(ev.target) && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      var f = document.querySelector("[data-filter]");
      if (f) { ev.preventDefault(); f.focus(); }
      return;
    }
    if (ev.key === "Escape") {
      var links = document.querySelector(".nav .links.open");
      if (links) {
        links.classList.remove("open");
        var tg = document.querySelector(".nav .toggle");
        if (tg) { tg.setAttribute("aria-expanded", "false"); tg.focus(); }
      } else if (isTyping(ev.target) && ev.target.matches("[data-filter]")) {
        ev.target.blur();
      }
    }
  });

  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);

  // ─── Init ───
  root.classList.add("js");
  initStars();
  renderGlyphs();
  renderConsoles();
  renderFooter();
  renderRelic();
  renderUptime();
  renderProgress();
  document.querySelectorAll("[data-decipher]").forEach(decipher);
  initReveal();
  initToc();
  root.dataset.glyphs = String(state.glyphStrips);
})();
