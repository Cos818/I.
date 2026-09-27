/* Axe Capital — shared behaviour for every page.
   Header state, navigation, reveals, the connected photographic stage and the
   enquiry form. Everything degrades to plain, readable HTML if this file fails. */
(function () {
  "use strict";
  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---- Header: solid surface once the page is scrolled ---- */
  var header = document.querySelector(".header");
  function updateHeader() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 24);
  }
  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  /* ---- Expertise disclosure menu (click, keyboard, touch) ---- */
  var trigger = document.querySelector(".nav__trigger");
  var menu = trigger && document.getElementById(trigger.getAttribute("aria-controls"));
  function setMenu(open) {
    if (!trigger || !menu) return;
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
    menu.classList.toggle("is-open", open);
  }
  if (trigger && menu) {
    trigger.addEventListener("click", function () {
      setMenu(trigger.getAttribute("aria-expanded") !== "true");
    });
    trigger.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); setMenu(true); menu.querySelector("a").focus(); }
    });
    menu.addEventListener("keydown", function (e) {
      var links = Array.prototype.slice.call(menu.querySelectorAll("a"));
      var i = links.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); (links[i + 1] || links[0]).focus(); }
      if (e.key === "ArrowUp") { e.preventDefault(); (links[i - 1] || links[links.length - 1]).focus(); }
      if (e.key === "Escape") { setMenu(false); trigger.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (!trigger.contains(e.target) && !menu.contains(e.target)) setMenu(false);
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
    trigger.parentElement.addEventListener("focusout", function (e) {
      if (!trigger.parentElement.contains(e.relatedTarget)) setMenu(false);
    });
  }

  /* ---- Mobile menu ---- */
  var toggle = document.querySelector(".menu-toggle");
  var mobile = document.getElementById("mobile-menu");
  var closeBtn = mobile && mobile.querySelector(".mobile-menu__close");
  var lastFocus = null;
  function openMobile() {
    lastFocus = document.activeElement;
    mobile.classList.add("is-open");
    mobile.removeAttribute("aria-hidden");
    document.body.classList.add("menu-open");
    toggle.setAttribute("aria-expanded", "true");
    if (header) header.classList.add("is-open");
    window.setTimeout(function () { closeBtn.focus(); }, 30);
  }
  function closeMobile() {
    mobile.classList.remove("is-open");
    mobile.setAttribute("aria-hidden", "true");
    document.body.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
    if (header) header.classList.remove("is-open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  if (toggle && mobile && closeBtn) {
    mobile.setAttribute("aria-hidden", "true");
    toggle.addEventListener("click", openMobile);
    closeBtn.addEventListener("click", closeMobile);
    mobile.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { closeMobile(); return; }
      if (e.key !== "Tab") return;
      var focusable = mobile.querySelectorAll("a[href], button:not([disabled])");
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    mobile.querySelectorAll("a[href]").forEach(function (a) { a.addEventListener("click", closeMobile); });
    window.matchMedia("(min-width: 900px)").addEventListener("change", function (e) { if (e.matches && mobile.classList.contains("is-open")) closeMobile(); });
  }

  /* ---- Reveals: panels and content sections ---- */
  var blocks = Array.prototype.slice.call(document.querySelectorAll(".panel, .section, .pager"));
  function revealInView() {
    var vh = window.innerHeight;
    blocks.forEach(function (b) {
      if (b.classList.contains("is-visible")) return;
      var r = b.getBoundingClientRect();
      if (r.top < vh * 0.85 && r.bottom > vh * 0.15) b.classList.add("is-visible");
    });
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12 });
    blocks.forEach(function (b) { io.observe(b); });
  }
  // Safety nets so content is never left hidden if observation is delayed or unsupported.
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () { revealInView(); ticking = false; });
  }, { passive: true });
  window.setTimeout(revealInView, 300);
  window.setTimeout(revealInView, 1500);

  /* ---- Copyright year ---- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  /* ---- Enquiry form ----
     Set data-endpoint on the <form> to a JSON-accepting POST endpoint (for example a
     Formspree, Basin or Netlify Forms URL) and the form submits there. Until then it
     validates and reports honestly that nothing was sent. */
  var form = document.getElementById("enquiry-form");
  if (form) {
    var result = document.getElementById("enquiry-result");
    var submitBtn = form.querySelector('[type="submit"]');
    var fields = Array.prototype.slice.call(form.querySelectorAll("[data-validate]"));
    var endpoint = (form.getAttribute("data-endpoint") || "").trim();
    function show(kind, html) {
      result.hidden = false;
      result.className = "form-notice form-notice--result form-notice--" + kind;
      result.innerHTML = html;
      result.focus();
    }
    function validate(field) {
      var wrap = field.closest(".field");
      var error = wrap.querySelector(".field__error");
      var value = field.type === "checkbox" ? (field.checked ? "yes" : "") : field.value.trim();
      var message = "";
      if (field.required && !value) message = field.type === "checkbox" ? "Please confirm before sending." : "Please complete this field.";
      else if (field.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) message = "Please enter a valid email address.";
      wrap.classList.toggle("has-error", !!message);
      field.setAttribute("aria-invalid", message ? "true" : "false");
      if (error) error.textContent = message;
      return !message;
    }
    fields.forEach(function (f) {
      f.addEventListener("blur", function () { validate(f); });
      f.addEventListener("input", function () { if (f.closest(".field").classList.contains("has-error")) validate(f); });
      f.addEventListener("change", function () { if (f.closest(".field").classList.contains("has-error")) validate(f); });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = fields.map(validate).every(Boolean);
      if (!ok) {
        var firstBad = form.querySelector(".has-error [data-validate]");
        if (firstBad) firstBad.focus();
        return;
      }
      // Honeypot: silently succeed for bots that fill the hidden field.
      var trap = form.querySelector('[name="company_website"]');
      if (trap && trap.value) { show("success", "<strong>Thank you.</strong> Your message has been received."); form.reset(); return; }

      if (!endpoint) {
        show("error", "<strong>Not sent.</strong> This form is not yet connected to an enquiry destination, so your message has not been delivered. Please try again once the site is live, or contact us directly.");
        return;
      }
      if (submitBtn) { submitBtn.setAttribute("aria-disabled", "true"); submitBtn.disabled = true; }
      var data = new FormData(form);
      fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (res) { if (!res.ok) throw new Error("HTTP " + res.status); return res; })
        .then(function () {
          form.reset();
          show("success", "<strong>Thank you.</strong> Your message has been received and a member of the team will be in touch shortly.");
        })
        .catch(function () {
          show("error", "<strong>Something went wrong.</strong> Your message could not be sent. Please try again in a moment or contact us directly.");
        })
        .then(function () { if (submitBtn) { submitBtn.removeAttribute("aria-disabled"); submitBtn.disabled = false; } });
    });
  }
})();

/* Connected photographic stage: panel images live on one fixed layer and
   cross-fade as the document scrolls. Solid sections simply cover the stage.
   No external libraries or network requests. */
(function () {
  "use strict";
  var root = document.documentElement;
  var main = document.getElementById("main");
  if (!main) return;
  var panels = Array.prototype.slice.call(main.querySelectorAll(".panel")).filter(function (p) {
    return p.querySelector(".panel__media picture img");
  });
  var motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  var scenes = [], stage = null, positions = [];
  var viewport = window.innerHeight, frame = 0, measureFrame = 0;
  var visualY = window.scrollY, visualTime = 0;
  var wheelFrame = 0, wheelTarget = 0, wheelY = 0, wheelTime = 0;
  var clamp = function (n, lo, hi) { return Math.max(lo, Math.min(hi, n)); };
  var smoothstep = function (t) { return t * t * (3 - 2 * t); };

  function measure() {
    measureFrame = 0;
    viewport = window.innerHeight;
    positions = panels.map(function (panel) { return panel.getBoundingClientRect().top + window.scrollY; });
    schedule();
  }
  function queueMeasure() {
    if (!measureFrame) measureFrame = window.requestAnimationFrame(measure);
  }
  function render(now) {
    frame = 0;
    if (!stage || document.hidden) return;
    var target = window.scrollY;
    var dt = visualTime ? Math.min(64, now - visualTime) : 16;
    visualTime = now;
    if (Math.abs(target - visualY) > viewport * 1.35) visualY = target;
    else visualY += (target - visualY) * (1 - Math.exp(-dt / 85));
    if (Math.abs(target - visualY) < .2) visualY = target;

    // Keep the outgoing scene opaque underneath the incoming scene: no dark dip.
    var next = 1;
    while (next < scenes.length && scenes[next].ready && visualY >= positions[next] - viewport * .16) next++;
    var current = Math.min(next - 1, scenes.length - 1);
    var blend = next < scenes.length ? smoothstep(clamp((visualY - positions[next] + viewport * .84) / (viewport * .68), 0, 1)) : 0;
    if (next < scenes.length && !scenes[next].ready) blend = 0;

    scenes.forEach(function (scene, index) {
      var active = index === current || (index === next && blend > 0);
      var opacity = index === current ? 1 : (index === next ? blend : 0);
      scene.media.classList.toggle("is-active", active);
      scene.media.style.opacity = String(opacity);
      if (active) {
        var travel = clamp((visualY - positions[index]) / viewport, -1.2, 1.2);
        var shift = -travel * Math.min(viewport * .027, 30);
        scene.picture.style.transform = "translate3d(0," + shift.toFixed(2) + "px,0) scale(1.012)";
      }
    });
    if (visualY !== target) schedule();
  }
  function schedule() {
    if (stage && !frame && !document.hidden) frame = window.requestAnimationFrame(render);
  }
  function mount() {
    if (stage || motion.matches || panels.length < 2) return;
    stage = document.createElement("div");
    stage.className = "visual-flow";
    stage.setAttribute("aria-hidden", "true");
    document.body.insertBefore(stage, main);
    scenes = panels.map(function (panel) {
      var media = panel.querySelector(".panel__media");
      var picture = media.querySelector("picture");
      var image = media.querySelector("img");
      var marker = document.createComment("Original image position: " + panel.id);
      media.parentNode.insertBefore(marker, media);
      var scene = { panel: panel, media: media, picture: picture, image: image, marker: marker, ready: image.complete && image.naturalWidth > 0 };
      media.classList.add("visual-flow__layer");
      media.setAttribute("data-scene", panel.id);
      media.setAttribute("data-scrim", panel.getAttribute("data-scrim") || "left");
      image.loading = "eager";
      image.addEventListener("load", function () { scene.ready = true; schedule(); }, { once: true });
      stage.appendChild(media);
      return scene;
    });
    root.classList.add("flow-ready");
    visualY = window.scrollY;
    visualTime = 0;
    measure();
  }
  function unmount() {
    stopWheel();
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    if (!stage) return;
    root.classList.remove("flow-ready");
    scenes.forEach(function (scene) {
      scene.marker.parentNode.insertBefore(scene.media, scene.marker);
      scene.marker.remove();
      scene.media.classList.remove("visual-flow__layer", "is-active");
      scene.media.removeAttribute("data-scene");
      scene.media.removeAttribute("data-scrim");
      scene.media.style.removeProperty("opacity");
      scene.picture.style.removeProperty("transform");
    });
    stage.remove(); stage = null; scenes = [];
  }

  /* Mouse-wheel easing; touch, keyboard, nested scrollers and zoom stay native. */
  function stopWheel() {
    if (wheelFrame) window.cancelAnimationFrame(wheelFrame);
    wheelFrame = 0; wheelTime = 0;
    root.classList.remove("is-wheel-scrolling");
  }
  function easeWheel(now) {
    wheelFrame = 0;
    var dt = wheelTime ? Math.min(64, now - wheelTime) : 16;
    wheelTime = now;
    var max = Math.max(0, root.scrollHeight - window.innerHeight);
    wheelTarget = clamp(wheelTarget, 0, max);
    wheelY += (wheelTarget - wheelY) * (1 - Math.exp(-dt / 90));
    if (Math.abs(wheelTarget - wheelY) < .7) wheelY = wheelTarget;
    window.scrollTo(0, wheelY);
    if (wheelY !== wheelTarget) wheelFrame = window.requestAnimationFrame(easeWheel);
    else stopWheel();
  }
  function nestedScroll(target, delta) {
    for (var el = target; el && el !== document.body; el = el.parentElement) {
      if (el.scrollHeight <= el.clientHeight + 1) continue;
      var overflow = window.getComputedStyle(el).overflowY;
      if (!/(auto|scroll|overlay)/.test(overflow)) continue;
      if ((delta < 0 && el.scrollTop > 0) || (delta > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1)) return true;
    }
    return false;
  }
  window.addEventListener("wheel", function (event) {
    if (!stage || motion.matches || !finePointer.matches || event.defaultPrevented || !event.cancelable || event.ctrlKey || event.metaKey || event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || document.body.classList.contains("menu-open")) return;
    var target = event.target instanceof Element ? event.target : document.body;
    if (target.closest("input, textarea, select, [contenteditable='true']") || nestedScroll(target, event.deltaY)) return;
    var max = Math.max(0, root.scrollHeight - window.innerHeight);
    var delta = event.deltaY * (event.deltaMode === 1 ? 28 : event.deltaMode === 2 ? viewport * .9 : 1);
    if (!delta || (!wheelFrame && ((window.scrollY <= 0 && delta < 0) || (window.scrollY >= max - 1 && delta > 0)))) return;
    event.preventDefault();
    if (!wheelFrame) { wheelY = window.scrollY; wheelTarget = wheelY; wheelTime = 0; }
    wheelTarget = clamp(wheelTarget + clamp(delta, -viewport * .9, viewport * .9), 0, max);
    root.classList.add("is-wheel-scrolling");
    if (!wheelFrame) wheelFrame = window.requestAnimationFrame(easeWheel);
  }, { passive: false });
  window.addEventListener("pointerdown", stopWheel, { passive: true });
  window.addEventListener("touchstart", stopWheel, { passive: true });
  window.addEventListener("keydown", function (event) {
    if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " ", "Tab"].indexOf(event.key) !== -1) stopWheel();
  });
  document.addEventListener("click", function (event) { if (event.target.closest && event.target.closest("a[href]")) stopWheel(); });
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", queueMeasure, { passive: true });
  window.addEventListener("pageshow", function () { visualY = window.scrollY; queueMeasure(); });
  window.addEventListener("hashchange", function () { stopWheel(); schedule(); });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stopWheel();
    else { visualY = window.scrollY; visualTime = 0; schedule(); }
  });
  motion.addEventListener("change", function () { if (motion.matches) unmount(); else mount(); });
  finePointer.addEventListener("change", stopWheel);
  if ("ResizeObserver" in window) new ResizeObserver(queueMeasure).observe(main);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(queueMeasure);
  mount();
})();
