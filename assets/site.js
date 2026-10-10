/* GodMod — shared site behaviour (no dependencies) */
(function () {
  "use strict";

  /* ---------- toast ---------- */
  var toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.id = "toast";
      toastEl.setAttribute("role", "status");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("on"); }, 1700);
  }

  function copyText(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)["catch"](function () {});
      }
    } catch (e) { /* clipboard unavailable (e.g. some file:// contexts) */ }
  }

  /* ---------- copy buttons ---------- */
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

    /* ---------- mobile nav ---------- */
    var toggle = ev.target.closest(".nav .toggle");
    if (toggle) {
      var links = document.querySelector(".nav .links");
      if (links) {
        var open = links.classList.toggle("open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      }
      return;
    }

    /* ---------- mobile sidebar ---------- */
    var sToggle = ev.target.closest(".sidebar .s-toggle");
    if (sToggle) {
      var side = sToggle.closest(".sidebar");
      if (side) {
        var sOpen = side.classList.toggle("open");
        sToggle.setAttribute("aria-expanded", sOpen ? "true" : "false");
      }
    }
  });

  /* ---------- sidebar module filter ---------- */
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

  /* ---------- "on this page" highlighting ---------- */
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll(".toc a[href^='#']"));
  if (tocLinks.length && "IntersectionObserver" in window) {
    var map = {};
    tocLinks.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      var el = document.getElementById(id);
      if (el) map[id] = a;
    });
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var a = map[en.target.id];
        if (!a) return;
        if (en.isIntersecting) {
          tocLinks.forEach(function (x) { x.style.color = ""; x.style.fontWeight = ""; });
          a.style.color = "var(--teal-dark)";
          a.style.fontWeight = "600";
        }
      });
    }, { rootMargin: "-80px 0px -70% 0px", threshold: 0 });
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) obs.observe(el);
    });
  }
})();
