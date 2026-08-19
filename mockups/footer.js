/* ============================================================
   GLOBAL FOOTER — air.inc-style "ground" footer (migration).
   Self-injecting, no dependencies. Add to any page with:
     <link rel="stylesheet" href="footer.css">
     <script src="footer.js" defer></script>
   Inherits the page's tokens; includes a live Bay-Area clock.
   ============================================================ */
(function () {
  'use strict';
  if (document.getElementById('gfooter')) return;

  var f = document.createElement('footer');
  f.id = 'gfooter';
  f.className = 'ground';
  f.innerHTML =
    '<div class="gf-sky" aria-hidden="true"><span class="gf-cloud c1"></span><span class="gf-cloud c2"></span><span class="gf-cloud c3"></span><span class="gf-cloud c4"></span></div>' +
    '<div class="ground-contact">' +
      '<div class="gf-top">' +
        '<div class="gf-cta">' +
          '<div class="ground-kick">contact</div>' +
          '<h2 class="ground-ttl">let’s build <em>something that matters.</em></h2>' +
          '<a class="ground-mail" href="mailto:gauravilinjara@gmail.com">gauravilinjara@gmail.com <span class="arw">→</span></a>' +
          '<p class="ground-sub">care about <b>design</b>, <b>impact</b>, and products that actually ship? you know where to find me.</p>' +
        '</div>' +
        '<nav class="gf-cols" aria-label="footer">' +
          '<div class="gf-col"><span class="gf-h">explore</span>' +
            '<a href="work.html">work</a>' +
            '<a href="beyond.html">lil about me</a>' +
            '<a href="lab.html">art lab</a>' +
            '<a href="assets/files/Gauravi_Linjara_Resume.pdf" target="_blank" rel="noopener">résumé ↓</a>' +
          '</div>' +
          '<div class="gf-col"><span class="gf-h">connect</span>' +
            '<a href="https://www.linkedin.com/in/gauravi-linjara/" target="_blank" rel="noopener">linkedin ↗</a>' +
            '<a href="mailto:gauravilinjara@gmail.com">email ↗</a>' +
            '<a href="https://gauravi.design" target="_blank" rel="noopener">gauravi.design ↗</a>' +
          '</div>' +
          '<div class="gf-col"><span class="gf-h">status</span>' +
            '<span class="gf-avail"><i></i> open to new work</span>' +
            '<span class="gf-line">based in the bay area</span>' +
            '<span class="gf-line">local time <b id="gfClock">—</b></span>' +
          '</div>' +
        '</nav>' +
      '</div>' +
      '<div class="gf-bar">' +
        '<a class="gf-mark" href="/"><svg viewBox="0 0 30 26" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" aria-hidden="true"><path d="M9 18a6 6 0 0 1 12 0" fill="currentColor" stroke="none"/><line x1="15" y1="7" x2="15" y2="4.2"/><line x1="7.2" y1="10.2" x2="5.4" y2="8.6"/><line x1="22.8" y1="10.2" x2="24.6" y2="8.6"/><line x1="2.5" y1="18" x2="27.5" y2="18"/></svg>gauravi.</a>' +
        '<div class="gf-meta"><span>© 2026 gauravi linjara</span><span>designed &amp; built by me — and a few too many coffees · switzer + react</span></div>' +
      '</div>' +
    '</div>';

  var host = document.getElementById('afterInner') || document.body;
  host.appendChild(f);

  // staggered fade-up reveal when the footer scrolls into view
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    f.classList.add('in');
  } else {
    var fio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { f.classList.add('in'); fio.disconnect(); } });
    }, { threshold: 0.18 });
    fio.observe(f);
  }
  if (host !== document.body) {
    var remeasure = function () { window.dispatchEvent(new Event('resize')); };
    remeasure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
    setTimeout(remeasure, 600);
  }

  // live Bay-Area clock
  var el = f.querySelector('#gfClock');
  if (el) {
    var tick = function () {
      try { el.textContent = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' }); }
      catch (e) { el.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
    };
    tick(); setInterval(tick, 15000);
  }
})();
