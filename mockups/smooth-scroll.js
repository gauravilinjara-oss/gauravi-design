/* ============================================================
   smooth-scroll.js, site-wide buttery scroll via Lenis,
   synced to GSAP ScrollTrigger.
   - Loads Lenis from CDN.
   - If GSAP + ScrollTrigger are present, drives Lenis from the
     GSAP ticker and keeps ScrollTrigger in lockstep (prevents
     stale scroll limits / dead zones / reveals not firing).
   - Re-measures limits after fonts, images and load settle.
   - Respects prefers-reduced-motion; skips touch/coarse devices.
   - Exposes window.__lenis.
   ============================================================ */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = matchMedia('(pointer: coarse)').matches;
  if (reduce || coarse) return;

  var s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/lenis@1.1.20/dist/lenis.min.js';
  s.defer = true;
  s.onload = function () {
    var L = window.Lenis || (window.lenis && window.lenis.default);
    if (!L) return;                       // fail soft, native scroll still works
    var lenis = new L({
      duration: 1.2,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, // expo-out
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6
    });
    window.__lenis = lenis;

    var gsap = window.gsap, ST = window.ScrollTrigger;
    if (gsap && ST) {
      // keep ScrollTrigger in lockstep with Lenis and let GSAP's ticker drive the rAF loop
      lenis.on('scroll', ST.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      var raf = function (time) { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }

    // recompute scroll limits whenever the page height settles (fonts, images, late layout)
    function resync() {
      lenis.resize();
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    }
    addEventListener('load', resync);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(resync);
    [].forEach.call(document.images, function (img) {
      if (!img.complete) img.addEventListener('load', resync, { once: true });
    });
    setTimeout(resync, 600);
    setTimeout(resync, 1600);
  };
  s.onerror = function () { /* CDN blocked, native scroll, no harm */ };
  document.head.appendChild(s);
})();
