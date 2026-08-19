/* ============================================================
   NAV — self-injecting brand mark + bottom dock (migration).
   Injects #gnav at the top of <body>, and hides the page's old
   top-bar nav so there's no duplicate. Pairs with nav.css.
     <link rel="stylesheet" href="nav.css">
     <script src="nav.js" defer></script>
   ============================================================ */
(function () {
  'use strict';
  if (document.getElementById('gnav')) return;

  // hide legacy top-bar navs (class names used across the old pages)
  document.querySelectorAll('.wnav, nav.top, .case-top, .nav-old').forEach(function (n) {
    n.style.display = 'none';
  });

  var n = document.createElement('div');
  n.id = 'gnav';
  n.innerHTML =
    '<div class="gnav-bar">' +
      '<a class="gnav-brand" href="/"><svg class="gnav-mark" viewBox="0 0 30 26" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" aria-hidden="true"><g class="sun"><path d="M9 18a6 6 0 0 1 12 0" fill="currentColor" stroke="none"/><line x1="15" y1="7" x2="15" y2="4.2"/><line x1="7.2" y1="10.2" x2="5.4" y2="8.6"/><line x1="22.8" y1="10.2" x2="24.6" y2="8.6"/></g><line x1="2.5" y1="18" x2="27.5" y2="18"/></svg>gauravi<span class="gnav-dot">.</span></a>' +
      '<button class="gnav-burger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="gnavMenu"><span class="gb-txt">menu</span><span class="gb-ico"><span class="gb-l"></span><span class="gb-l"></span></span></button>' +
    '</div>' +
    '<nav class="gnav-dock" aria-label="primary">' +
      '<a href="work.html">work</a>' +
      '<a href="beyond.html">about</a>' +
      '<a href="/lab">art lab</a>' +
      '<a href="blog.html">blogs</a>' +
      '<a href="https://www.linkedin.com/in/gauravi-linjara/" target="_blank" rel="noopener">linkedin <span class="exti">↗</span></a>' +
      '<a href="assets/files/Gauravi_Linjara_Resume.pdf" target="_blank" rel="noopener">résumé <span class="exti">↓</span></a>' +
      '<a class="cta" href="quick.html">quick view <span class="arw">&rarr;</span></a>' +
      '<a class="cta cta-ghost" href="mailto:gauravilinjara@gmail.com">let&rsquo;s talk <span class="arw">&rarr;</span></a>' +
    '</nav>' +
    '<div class="gnav-menu" id="gnavMenu" aria-hidden="true"><nav class="gnav-menu-inner" aria-label="menu"></nav></div>';
  document.body.insertBefore(n, document.body.firstChild);

  // ── mobile hamburger: clone the dock links into a full-screen menu + wire the toggle ──
  (function () {
    var menuInner = n.querySelector('.gnav-menu-inner');
    n.querySelectorAll('.gnav-dock a').forEach(function (a) { menuInner.appendChild(a.cloneNode(true)); });
    var burger = n.querySelector('.gnav-burger');
    var menu = n.querySelector('.gnav-menu');
    function setOpen(open) {
      n.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.setAttribute('aria-hidden', open ? 'false' : 'true');
      document.documentElement.style.overflow = open ? 'hidden' : '';
    }
    burger.addEventListener('click', function () { setOpen(!n.classList.contains('menu-open')); });
    menu.addEventListener('click', function (e) { if (e.target === menu || e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  })();

  // case-study pages get a "back to work" link beside the brand
  if (/\/case-/.test(location.pathname)) {
    n.classList.add('is-case');
    var back = document.createElement('a');
    back.className = 'gnav-back';
    back.href = 'work.html';
    back.innerHTML = '<span class="exti">←</span> back to work';
    var bar = n.querySelector('.gnav-bar');
    bar.insertBefore(back, bar.firstChild);
    var brand = n.querySelector('.gnav-brand');
    if (brand) brand.remove();
  }
})();
