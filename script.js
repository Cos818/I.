/* ==========================================================================
   BBG Media — interactions
   - Hero light streaks (canvas): fibre-optic strands fanning from the left,
     with a static blurred glow layer and an animated pulse layer.
   - Nav scroll state, mobile menu, scroll reveal.
   ========================================================================== */

(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------------------------------------------------
     Hero streaks
     ---------------------------------------------------------------------- */
  const glowCanvas = document.getElementById("glow");
  const streakCanvas = document.getElementById("streaks");

  if (glowCanvas && streakCanvas) {
    const glow = glowCanvas.getContext("2d");
    const ctx = streakCanvas.getContext("2d");
    const hero = streakCanvas.parentElement;

    const COUNT = 150;
    const DPR = Math.min(window.devicePixelRatio || 1, 1.5);

    let W = 0, H = 0;
    let strands = [];
    let raf = 0;
    let running = false;
    let pointerX = 0, pointerY = 0, targetX = 0, targetY = 0;

    // Palette lifted from the logo: chrome white, lilac, electric blue, magenta.
    const palette = [
      [244, 240, 255],
      [200, 184, 255],
      [160, 140, 255],
      [120, 130, 255],
      [225, 150, 255]
    ];

    function rand(a, b) { return a + Math.random() * (b - a); }

    function build() {
      strands = [];
      for (let i = 0; i < COUNT; i++) {
        const t = i / (COUNT - 1);          // 0 → 1 top to bottom
        const spread = (t - 0.5) * 2;       // -1 → 1
        const c = palette[Math.floor(Math.random() * palette.length)];
        strands.push({
          spread,
          // vertical landing point on the right side of the visual area
          endT: 0.5 + spread * rand(0.55, 0.78) * (Math.random() < 0.5 ? 1 : 0.85),
          mid: rand(0.38, 0.62),
          wobble: rand(0.012, 0.045),
          phase: rand(0, Math.PI * 2),
          speed: rand(0.12, 0.3),
          width: rand(0.5, 1.5),
          alpha: rand(0.12, 0.5),
          color: c,
          dashLen: rand(90, 240),
          dashGap: rand(360, 900),
          dashSpeed: rand(40, 110),
          dashOffset: rand(0, 1000)
        });
      }
    }

    function resize() {
      const rect = hero.getBoundingClientRect();
      W = Math.max(1, Math.floor(rect.width));
      H = Math.max(1, Math.floor(rect.height));
      for (const cv of [glowCanvas, streakCanvas]) {
        cv.width = Math.floor(W * DPR);
        cv.height = Math.floor(H * DPR);
      }
      glow.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      build();
      drawGlow();
      if (reduceMotion) drawFrame(0);
    }

    // Geometry: strands converge off the left edge and fan toward the centre of
    // the hero on desktop (the headline sits on the right half), or across the
    // whole width on mobile where the text sits lower.
    function layout() {
      const mobile = W < 860;
      return {
        x0: -W * 0.06,
        y0: H * (mobile ? 0.34 : 0.5),
        xEnd: mobile ? W * 1.15 : W * 0.78,
        yScale: mobile ? 0.7 : 1
      };
    }

    function strandPath(target, s, time, px, py) {
      const L = layout();
      const x0 = L.x0 + px * 10;
      const y0 = L.y0 + py * 14;
      const endY = L.y0 + (s.endT - 0.5) * H * L.yScale + Math.sin(time * s.speed + s.phase) * H * s.wobble;
      const x3 = L.xEnd;
      const x1 = x0 + (x3 - x0) * 0.28;
      const y1 = y0 + (endY - y0) * 0.05 + Math.sin(time * s.speed * 0.7 + s.phase) * H * 0.015;
      const x2 = x0 + (x3 - x0) * s.mid;
      const y2 = endY + Math.cos(time * s.speed * 0.9 + s.phase) * H * s.wobble * 1.6;
      target.beginPath();
      target.moveTo(x0, y0);
      target.bezierCurveTo(x1, y1, x2, y2, x3, endY);
    }

    function drawGlow() {
      glow.clearRect(0, 0, W, H);
      glow.globalCompositeOperation = "lighter";
      glow.lineCap = "round";
      for (const s of strands) {
        strandPath(glow, s, 0, 0, 0);
        const [r, g, b] = s.color;
        glow.strokeStyle = `rgba(${r},${g},${b},${s.alpha * 0.55})`;
        glow.lineWidth = s.width * 2.2;
        glow.stroke();
      }
      // Core bloom near the convergence point
      const L = layout();
      const grad = glow.createRadialGradient(L.x0 + W * 0.08, L.y0, 0, L.x0 + W * 0.08, L.y0, W * 0.22);
      grad.addColorStop(0, "rgba(220, 205, 255, 0.55)");
      grad.addColorStop(0.4, "rgba(150, 125, 255, 0.22)");
      grad.addColorStop(1, "rgba(150, 125, 255, 0)");
      glow.fillStyle = grad;
      glow.fillRect(0, 0, W, H);
    }

    function drawFrame(time) {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";

      for (const s of strands) {
        strandPath(ctx, s, time, pointerX, pointerY);
        const [r, g, b] = s.color;

        // Base thin strand
        ctx.setLineDash([]);
        ctx.strokeStyle = `rgba(${r},${g},${b},${s.alpha})`;
        ctx.lineWidth = s.width;
        ctx.stroke();

        // Travelling light pulse
        if (!reduceMotion) {
          ctx.setLineDash([s.dashLen, s.dashGap]);
          ctx.lineDashOffset = -(s.dashOffset + time * s.dashSpeed);
          ctx.strokeStyle = `rgba(255,255,255,${s.alpha * 0.9})`;
          ctx.lineWidth = s.width * 1.4;
          ctx.stroke();
        }
      }
      ctx.setLineDash([]);
    }

    let start = 0;
    function loop(ts) {
      if (!running) return;
      if (!start) start = ts;
      const time = (ts - start) / 1000;
      pointerX += (targetX - pointerX) * 0.04;
      pointerY += (targetY - pointerY) * 0.04;
      drawFrame(time);
      raf = requestAnimationFrame(loop);
    }

    function play() {
      if (running || reduceMotion) return;
      running = true;
      raf = requestAnimationFrame(loop);
    }
    function pause() {
      running = false;
      cancelAnimationFrame(raf);
    }

    // Only animate while the hero is on screen
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? play() : pause()));
    }, { threshold: 0.02 });
    io.observe(hero);

    document.addEventListener("visibilitychange", () => {
      document.hidden ? pause() : play();
    });

    window.addEventListener("pointermove", (e) => {
      targetX = (e.clientX / window.innerWidth - 0.5);
      targetY = (e.clientY / window.innerHeight - 0.5);
    }, { passive: true });

    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 120);
    });

    resize();
  }

  /* ----------------------------------------------------------------------
     Nav scroll state
     ---------------------------------------------------------------------- */
  const nav = document.querySelector(".nav");
  const sentinel = document.createElement("div");
  sentinel.style.cssText = "position:absolute;top:0;left:0;height:1px;width:1px;pointer-events:none;";
  document.body.prepend(sentinel);
  new IntersectionObserver(([e]) => {
    nav.classList.toggle("is-scrolled", !e.isIntersecting);
  }, { rootMargin: "-40px 0px 0px 0px" }).observe(sentinel);

  /* ----------------------------------------------------------------------
     Mobile menu
     ---------------------------------------------------------------------- */
  const burger = document.getElementById("burger");
  const menu = document.getElementById("menu");
  function setMenu(open) {
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", String(!open));
    document.body.style.overflow = open ? "hidden" : "";
  }
  burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  /* ----------------------------------------------------------------------
     Scroll reveal
     ---------------------------------------------------------------------- */
  const reveals = document.querySelectorAll(".reveal");
  if (reduceMotion) {
    reveals.forEach((el) => el.classList.add("is-in"));
  } else {
    const ro = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          ro.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach((el) => ro.observe(el));
  }

  /* ----------------------------------------------------------------------
     Footer year
     ---------------------------------------------------------------------- */
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
