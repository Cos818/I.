/* Axe Capital: header state, navigation, panel reveals, scroll snapping and
   the contact form. Everything degrades to plain HTML if this file fails. */
(function () {
  "use strict";
  var html = document.documentElement;
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
    header.classList.add("is-open");
    window.setTimeout(function () { closeBtn.focus(); }, 30);
  }
  function closeMobile() {
    mobile.classList.remove("is-open");
    mobile.setAttribute("aria-hidden", "true");
    document.body.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
    header.classList.remove("is-open");
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

  /* ---- Panel reveals ---- */
  var panels = Array.prototype.slice.call(document.querySelectorAll(".panel"));
  function revealInView() {
    var vh = window.innerHeight;
    panels.forEach(function (p) {
      if (p.classList.contains("is-visible")) return;
      var r = p.getBoundingClientRect();
      if (r.top < vh * 0.85 && r.bottom > vh * 0.15) p.classList.add("is-visible");
    });
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12 });
    panels.forEach(function (p) { io.observe(p); });
  }
  // Safety nets: a scroll check (throttled to animation frames) and a timer,
  // so content is never left hidden if observation is delayed or unsupported.
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () { revealInView(); ticking = false; });
  }, { passive: true });
  window.setTimeout(revealInView, 300);
  window.setTimeout(revealInView, 1500);

  /* ---- Gentle scroll snapping on desktop, only while panels fit the viewport ---- */
  function updateSnap() {
    var wide = window.innerWidth >= 1024 && !reduceMotion.matches;
    var fits = panels.every(function (p) { return p.offsetHeight <= window.innerHeight + 2; });
    html.classList.toggle("snap", wide && fits && panels.length > 1);
  }
  updateSnap();
  var resizeTimer;
  window.addEventListener("resize", function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(updateSnap, 150); });
  if ("ResizeObserver" in window) {
    var ro = new ResizeObserver(function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(updateSnap, 150); });
    panels.forEach(function (p) { ro.observe(p); });
  }

  /* ---- Copyright year ---- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  /* ---- Contact form: validation and honest "not connected" state ---- */
  var form = document.getElementById("enquiry-form");
  if (form) {
    var result = document.getElementById("enquiry-result");
    var fields = Array.prototype.slice.call(form.querySelectorAll("[data-validate]"));
    function validate(field) {
      var wrap = field.closest(".field");
      var error = wrap.querySelector(".field__error");
      var value = field.value.trim();
      var message = "";
      if (field.required && !value) message = "Please complete this field.";
      else if (field.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) message = "Please enter a valid email address.";
      wrap.classList.toggle("has-error", !!message);
      field.setAttribute("aria-invalid", message ? "true" : "false");
      if (error) error.textContent = message;
      return !message;
    }
    fields.forEach(function (f) {
      f.addEventListener("blur", function () { validate(f); });
      f.addEventListener("input", function () { if (f.closest(".field").classList.contains("has-error")) validate(f); });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = fields.map(validate).every(Boolean);
      if (!ok) {
        var firstBad = form.querySelector(".has-error [data-validate]");
        if (firstBad) firstBad.focus();
        return;
      }
      // No submission endpoint has been supplied yet, so nothing is sent.
      // Replace this block with the real integration (see docs/HANDOVER.md).
      result.hidden = false;
      result.innerHTML = "<strong>Not sent.</strong> This preview is not yet connected to an enquiry destination, so your message has not been delivered. Connecting the form is a handover item.";
      result.focus();
    });
  }
})();
